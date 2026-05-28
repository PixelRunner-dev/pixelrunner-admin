import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ICategory, IFullApplet } from 'pixelrunner-shared';

type QueryState<T = unknown> = {
  data?: T;
  error?: string;
  isLoading?: boolean;
  isWaitingForPeer?: boolean;
  reload: ReturnType<typeof vi.fn>;
};

type ControllerQueryOptions = {
  canLoad: () => boolean;
  label: string;
  load: () => Promise<unknown>;
  onSuccess?: (value: unknown[]) => void;
  skipContext: () => Record<string, unknown>;
};

const libraryPageMock = vi.hoisted(() => ({
  applets: {
    getAllApplets: vi.fn(),
    getAllCategories: vi.fn(),
    getAppletsByCategoryKey: vi.fn()
  },
  hasAppletsApi: true,
  isConnected: { __v_isRef: true, value: true },
  isConnecting: { __v_isRef: true, value: false },
  lastError: { __v_isRef: true, value: null as Error | null },
  queryOptions: [] as ControllerQueryOptions[],
  queryStates: {} as Record<string, QueryState>,
  state: { __v_isRef: true, value: 'connected' }
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    applets: libraryPageMock.hasAppletsApi ? libraryPageMock.applets : null,
    isConnected: libraryPageMock.isConnected,
    isConnecting: libraryPageMock.isConnecting,
    lastError: libraryPageMock.lastError,
    state: libraryPageMock.state
  })
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn((options: ControllerQueryOptions) => {
    libraryPageMock.queryOptions.push(options);
    const state = libraryPageMock.queryStates[options.label] ?? createQueryState();

    return {
      clearRetryTimer: vi.fn(),
      data: { __v_isRef: true, value: state.data },
      error: { __v_isRef: true, value: state.error ?? '' },
      hasAttempted: { __v_isRef: true, value: true },
      isLoading: { __v_isRef: true, value: state.isLoading ?? false },
      isWaitingForPeer: { __v_isRef: true, value: state.isWaitingForPeer ?? false },
      reload: state.reload
    };
  })
}));

const clockApplet = createApplet('clock', 'Clock');
const weatherApplet = createApplet('weather', 'Weather');
const categories: ICategory[] = [
  { key: 'starter', icon: { iconId: 'sparkles' } },
  { key: 'music', icon: { iconId: 'music' } }
] as ICategory[];

describe('LibraryPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('configures all library queries and loads the expected applet API calls', async () => {
    await mountLibraryPage();

    expect(libraryPageMock.queryOptions.map((option) => option.label)).toEqual([
      'LibraryPage - spotlight',
      'LibraryPage - newlyAdded',
      'LibraryPage - starterPack',
      'LibraryPage - categories'
    ]);
    expect(libraryPageMock.queryOptions[0]?.skipContext()).toEqual({
      hasAppletsApi: true,
      categoryKey: 'spotlight'
    });

    await expect(libraryPageMock.queryOptions[0]?.load()).resolves.toEqual([clockApplet]);
    await expect(libraryPageMock.queryOptions[1]?.load()).resolves.toEqual([weatherApplet]);
    await expect(libraryPageMock.queryOptions[2]?.load()).resolves.toEqual([weatherApplet]);
    await expect(libraryPageMock.queryOptions[3]?.load()).resolves.toEqual(categories);

    expect(libraryPageMock.applets.getAppletsByCategoryKey).toHaveBeenCalledWith('spotlight');
    expect(libraryPageMock.applets.getAllApplets).toHaveBeenCalledWith({
      sortOrder: 'DESC',
      limit: 10
    });
    expect(libraryPageMock.applets.getAppletsByCategoryKey).toHaveBeenCalledWith('starter_pack');
    expect(libraryPageMock.applets.getAllCategories).toHaveBeenCalledOnce();
  });

  it('renders successful library sections and search shortcuts', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const wrapper = await mountLibraryPage();

    expect(wrapper.text()).toContain('t:libraryPage.pageTitle');
    expect(wrapper.text()).toContain('library-search');
    expect(wrapper.text()).toContain('t:libraryPage.spotlight.title');
    expect(wrapper.text()).toContain('carousel:clock');
    expect(wrapper.text()).toContain('t:libraryPage.new.title');
    expect(wrapper.text()).toContain('t:libraryPage.categories.title');
    expect(wrapper.text()).toContain('categories:starter,music');
    expect(wrapper.text()).toContain('t:libraryPage.starterPack.title');

    await buttonByText(wrapper, 'clock').trigger('click');

    expect(consoleLog).toHaveBeenCalledWith('click clock');
  });

  it('renders loading and waiting states for query branches', async () => {
    const wrapper = await mountLibraryPage({
      states: {
        'LibraryPage - spotlight': createQueryState({ data: undefined, isLoading: true }),
        'LibraryPage - newlyAdded': createQueryState({ data: undefined, isWaitingForPeer: true }),
        'LibraryPage - categories': createQueryState({ data: undefined, isLoading: true }),
        'LibraryPage - starterPack': createQueryState({ data: undefined, isWaitingForPeer: true })
      }
    });

    expect(wrapper.text()).toContain('Loading spotlight applets...');
    expect(wrapper.text()).toContain('Waiting for device connection...');
    expect(wrapper.text()).toContain('Loading categories...');
    expect(wrapper.text()).toContain('[Waiting for device connection...]');
  });

  it('renders error states and calls the matching retry handlers', async () => {
    const spotlightReload = vi.fn();
    const newlyAddedReload = vi.fn();
    const categoriesReload = vi.fn();
    const starterPackReload = vi.fn();
    const wrapper = await mountLibraryPage({
      states: {
        'LibraryPage - spotlight': createQueryState({
          data: undefined,
          error: 'spotlight failed',
          reload: spotlightReload
        }),
        'LibraryPage - newlyAdded': createQueryState({
          data: undefined,
          error: 'new failed',
          reload: newlyAddedReload
        }),
        'LibraryPage - categories': createQueryState({
          data: undefined,
          error: 'categories failed',
          reload: categoriesReload
        }),
        'LibraryPage - starterPack': createQueryState({
          data: undefined,
          error: 'starter failed',
          reload: starterPackReload
        })
      }
    });

    expect(wrapper.text()).toContain('spotlight failed');
    expect(wrapper.text()).toContain('new failed');
    expect(wrapper.text()).toContain('categories failed');
    expect(wrapper.text()).toContain('starter failed');

    for (const retryButton of wrapper.findAll('button').filter((button) => button.text() === 'Retry')) {
      await retryButton.trigger('click');
    }

    expect(spotlightReload).toHaveBeenCalledOnce();
    expect(newlyAddedReload).toHaveBeenCalledOnce();
    expect(categoriesReload).toHaveBeenCalledOnce();
    expect(starterPackReload).toHaveBeenCalledOnce();
  });

  it('throws from query loaders and reports skip context when the applets API is unavailable', async () => {
    await mountLibraryPage({ hasAppletsApi: false });

    for (const option of libraryPageMock.queryOptions) {
      expect(option.canLoad()).toBe(false);
      expect(option.skipContext()).toEqual(
        expect.objectContaining({ hasAppletsApi: false })
      );
      await expect(option.load()).rejects.toThrow('Applets API not available');
    }
  });

  it('renders the themed section in December when newly added applets are available', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-15T12:00:00.000Z'));

    const wrapper = await mountLibraryPage();

    expect(wrapper.text()).toContain('[themed items]');
    expect(wrapper.text()).toContain('[themed applets]');
  });
});

async function mountLibraryPage(options: {
  hasAppletsApi?: boolean;
  states?: Record<string, QueryState>;
} = {}) {
  resetLibraryPageMocks(options);
  const { default: LibraryPage } = await import('@/pages/Library/LibraryPage.vue');

  const wrapper = mount(LibraryPage, {
    global: {
      mocks: {
        $t: (key: string) => `t:${key}`
      },
      stubs: libraryPageStubs()
    }
  });

  await flushPromises();

  return wrapper;
}

function resetLibraryPageMocks(options: {
  hasAppletsApi?: boolean;
  states?: Record<string, QueryState>;
}): void {
  vi.clearAllMocks();
  libraryPageMock.hasAppletsApi = options.hasAppletsApi ?? true;
  libraryPageMock.isConnected.value = true;
  libraryPageMock.isConnecting.value = false;
  libraryPageMock.lastError.value = null;
  libraryPageMock.state.value = 'connected';
  libraryPageMock.queryOptions = [];
  libraryPageMock.queryStates = options.states ?? {
    'LibraryPage - spotlight': createQueryState({ data: [clockApplet] }),
    'LibraryPage - newlyAdded': createQueryState({ data: [weatherApplet] }),
    'LibraryPage - starterPack': createQueryState({ data: [weatherApplet] }),
    'LibraryPage - categories': createQueryState({ data: categories })
  };
  libraryPageMock.applets.getAppletsByCategoryKey.mockImplementation(async (key: string) =>
    key === 'spotlight' ? [clockApplet] : [weatherApplet]
  );
  libraryPageMock.applets.getAllApplets.mockResolvedValue([weatherApplet]);
  libraryPageMock.applets.getAllCategories.mockResolvedValue(categories);
}

function createQueryState(overrides: Partial<QueryState> = {}): QueryState {
  return {
    data: [],
    error: '',
    isLoading: false,
    isWaitingForPeer: false,
    reload: vi.fn(),
    ...overrides
  };
}

function createApplet(packageName: string, name: string): IFullApplet {
  return {
    categories: [],
    defaultImage: {
      src: `/${packageName}.webp`,
      alt: name,
      dateCreated: new Date('2026-01-01T00:00:00.000Z')
    },
    details: {
      name,
      summary: `${name} summary`,
      desc: `${name} description`,
      author: 'Pixelrunner'
    },
    fileName: `${packageName}.star`,
    isInstalled: false,
    packageName
  };
}

function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.text().includes(text));

  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }

  return button;
}

function libraryPageStubs() {
  return {
    AppletCard: {
      props: ['applet', 'hasCategories', 'view'],
      template: '<article>card:{{ applet.packageName }}:{{ view }}</article>'
    },
    AppletCarousel: {
      props: ['applets', 'itemWidth'],
      template: '<div>carousel:{{ applets.map((applet) => applet.packageName).join(",") }}:<slot v-bind="applets[0]" /></div>'
    },
    CategoryList: {
      props: ['categories', 'isInteractive'],
      template: '<div>categories:{{ categories.map((category) => category.key).join(",") }}:{{ isInteractive }}</div>'
    },
    DebugSection: {
      props: ['data'],
      template: '<pre data-testid="debug-section">{{ JSON.stringify(data) }}</pre>'
    },
    DButton: {
      emits: ['click'],
      template: '<button type="button" @click="$emit(\'click\', $event)"><slot /></button>'
    },
    DFlex: {
      template: '<ul><slot /></ul>'
    },
    DText: {
      props: ['is'],
      template: '<component :is="is || `span`"><slot /></component>'
    },
    FeatureToggle: {
      template: '<div><slot /></div>'
    },
    LibrarySearch: {
      template: '<div>library-search</div>'
    },
    LibrarySection: {
      props: ['payoff', 'title'],
      template: '<section><h2>{{ title }}</h2><p v-if="payoff">{{ payoff }}</p><slot /></section>'
    }
  };
}
