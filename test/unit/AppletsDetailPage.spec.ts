import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';

import type { IFullApplet, UUID } from 'pixelrunner-shared';

import en from '../../translations/en.json';

beforeAll(async () => {
  await i18next.init({ lng: 'en', resources: { en: { translation: en } } });
});

type RouteParams = Record<string, string | string[] | undefined>;

type QueryState = {
  data?: IFullApplet | null;
  error?: string;
  hasAttempted?: boolean;
  isLoading?: boolean;
  isWaitingForPeer?: boolean;
  reload: ReturnType<typeof vi.fn>;
};

type ControllerQueryOptions = {
  canLoad: () => boolean;
  defaultErrorMessage: string;
  label: string;
  load: () => Promise<unknown>;
  onSuccess?: (applet: IFullApplet | null) => void;
  skipContext: () => Record<string, unknown>;
};

type ReactiveRoute = {
  params: RouteParams;
};

const detailPageMock = vi.hoisted(() => ({
  applets: {
    get: vi.fn()
  },
  hasAppletsApi: true,
  isConnected: { __v_isRef: true, value: true },
  lastError: { __v_isRef: true, value: null as Error | null },
  notifications: {
    setNotification: vi.fn()
  },
  queryOptions: [] as ControllerQueryOptions[],
  queryState: undefined as QueryState | undefined,
  route: null as ReactiveRoute | null,
  routeParams: {} as RouteParams,
  state: { __v_isRef: true, value: 'connected' }
}));

vi.mock('vue-router', async () => {
  const { reactive } = await vi.importActual<typeof import('vue')>('vue');
  detailPageMock.route = reactive({ params: { ...detailPageMock.routeParams } });

  return {
    useRoute: () => detailPageMock.route
  };
});

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    applets: detailPageMock.hasAppletsApi ? detailPageMock.applets : null,
    isConnected: detailPageMock.isConnected,
    lastError: detailPageMock.lastError,
    state: detailPageMock.state
  })
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn((options: ControllerQueryOptions) => {
    detailPageMock.queryOptions.push(options);
    const state = detailPageMock.queryState ?? createQueryState();

    return {
      data: { __v_isRef: true, value: state.data },
      error: { __v_isRef: true, value: state.error ?? '' },
      hasAttempted: { __v_isRef: true, value: state.hasAttempted ?? true },
      isLoading: { __v_isRef: true, value: state.isLoading ?? false },
      isWaitingForPeer: { __v_isRef: true, value: state.isWaitingForPeer ?? false },
      reload: state.reload
    };
  })
}));

vi.mock('@/composables/useNotifications.ts', () => ({
  useNotifications: () => detailPageMock.notifications
}));

vi.mock('@/components/Applet/AppletConfig.vue', () => ({
  default: {
    props: ['applet'],
    template:
      '<section data-testid="config">config:{{ applet.packageName }}:{{ applet.installationDetails?.uuid || "none" }}</section>'
  }
}));

vi.mock('@/components/Applet/AppletDetails.vue', () => ({
  default: {
    props: ['name', 'view'],
    template: '<section data-testid="details">details:{{ name }}:{{ view }}</section>'
  }
}));

vi.mock('@/components/Applet/AppletImage.vue', () => ({
  default: {
    props: {
      alt: String,
      showFrame: Boolean,
      src: String
    },
    template: '<section data-testid="image">image:{{ src }}:{{ alt }}:{{ showFrame }}</section>'
  }
}));

vi.mock('@/components/Applet/AppletItem.vue', () => ({
  default: {
    props: ['applet'],
    template:
      '<article data-testid="item">item:{{ applet.packageName }}<slot name="item" v-bind="applet" /></article>'
  }
}));

vi.mock('@/components/CategoryList.vue', () => ({
  default: {
    props: {
      categories: Array,
      hasItemsInline: Boolean
    },
    template:
      '<section data-testid="categories">categories:{{ categories.map((category) => category.key).join(",") }}:{{ hasItemsInline }}</section>'
  }
}));

vi.mock('@/components/DebugSection.vue', () => ({
  default: {
    props: ['data'],
    template:
      '<pre data-testid="debug">debug:{{ data.packageName }}:{{ data.uuid }}:{{ data.loadedPackageName }}:{{ data.loadedUuid }}</pre>'
  }
}));

vi.mock('@/components/FeatureToggle.vue', () => ({
  default: {
    template: '<section data-testid="feature-toggle"><slot /></section>'
  }
}));

describe('Applets DetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('configures the applet query and loads by package name and installed uuid route params', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const applet = createApplet({ installed: true });

    await mountDetailPage({
      routeParams: {
        packageName: ['weather', 'ignored'],
        uuid: ['weather-uuid', 'ignored-uuid']
      }
    });
    detailPageMock.applets.get.mockResolvedValue(applet);

    const queryOptions = getQueryOptions();

    expect(queryOptions.label).toBe('DetailPage');
    expect(queryOptions.defaultErrorMessage).toBe('Failed to load applet');
    expect(queryOptions.canLoad()).toBe(true);
    expect(queryOptions.skipContext()).toEqual({
      hasAppletsApi: true,
      packageName: 'weather',
      uuid: 'weather-uuid'
    });
    await expect(queryOptions.load()).resolves.toBe(applet);

    expect(detailPageMock.applets.get).toHaveBeenCalledWith('weather', 'weather-uuid');

    queryOptions.onSuccess?.(null);
    expect(consoleLog).not.toHaveBeenCalled();

    queryOptions.onSuccess?.(applet);
    expect(consoleLog).toHaveBeenCalledWith('[DetailPage] Applet loaded:', {
      isInstalled: true,
      packageName: 'weather',
      uuid: 'weather-uuid'
    });

    queryOptions.onSuccess?.(createApplet({ installed: false }));
    expect(consoleLog).toHaveBeenCalledWith('[DetailPage] Applet loaded:', {
      isInstalled: false,
      packageName: 'weather',
      uuid: null
    });
  });

  it('renders installed applets with installed image, details, categories, config and debug state', async () => {
    const wrapper = await mountDetailPage({
      queryState: createQueryState({ data: createApplet({ installed: true }) }),
      routeParams: { packageName: 'weather', uuid: 'weather-uuid' }
    });

    expect(wrapper.text()).toContain('item:weather');
    expect(wrapper.text()).toContain(
      'image:/weather-installed.webp:Weather installed preview:true'
    );
    expect(wrapper.text()).toContain('details:Weather:full-detail');
    expect(wrapper.text()).toContain('categories:weather,clock:true');
    expect(wrapper.text()).toContain('config:weather:weather-uuid');
    expect(wrapper.text()).toContain('debug:weather:weather-uuid:weather:weather-uuid');
  });

  it('renders uninstalled applets with the default image and no installed uuid', async () => {
    const wrapper = await mountDetailPage({
      queryState: createQueryState({ data: createApplet({ installed: false }) }),
      routeParams: { packageName: 'weather' }
    });

    expect(wrapper.text()).toContain('image:/weather.webp:Weather preview:true');
    expect(wrapper.text()).toContain('config:weather:none');
    expect(wrapper.text()).toContain('debug:weather::weather:');
  });

  it('skips the category list when the loaded applet has no categories property', async () => {
    const applet = createApplet({ installed: false });
    delete (applet as Partial<IFullApplet>).categories;
    const wrapper = await mountDetailPage({
      queryState: createQueryState({ data: applet }),
      routeParams: { packageName: 'weather' }
    });

    expect(wrapper.find('[data-testid="categories"]').exists()).toBe(false);
  });

  it('reports loading, waiting, error and not-found states through notifications', async () => {
    await mountDetailPage({
      queryState: createQueryState({ data: null, isLoading: true })
    });
    expect(detailPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { message: 'Loading applet...', type: 'info' },
      { delay: 500 }
    );

    await mountDetailPage({
      queryState: createQueryState({ data: null, isWaitingForPeer: true })
    });
    expect(detailPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { message: 'Waiting for device connection...', type: 'info' },
      { delay: 500 }
    );

    await mountDetailPage({
      queryState: createQueryState({ data: null, error: 'load failed' })
    });
    expect(detailPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { hasCloseButton: true, message: 'load failed', type: 'error' },
      { delay: 500 }
    );

    const notFound = await mountDetailPage({
      queryState: createQueryState({ data: null })
    });
    expect(detailPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { hasCloseButton: true, message: 'Applet not found', type: 'warning' },
      { delay: 500 }
    );

    notFound.unmount();
    expect(detailPageMock.notifications.setNotification).toHaveBeenLastCalledWith(false, {
      hasCloseButton: true,
      message: 'Applet not found',
      type: 'warning'
    });
  });

  it('throws explicit loader errors for missing API and missing route identifiers', async () => {
    await mountDetailPage({ hasAppletsApi: false, routeParams: { packageName: 'weather' } });
    let queryOptions = getQueryOptions();

    expect(queryOptions.canLoad()).toBe(false);
    expect(queryOptions.skipContext()).toEqual({
      hasAppletsApi: false,
      packageName: 'weather',
      uuid: null
    });
    await expect(queryOptions.load()).rejects.toThrow('Applets API not available');

    await mountDetailPage({ routeParams: {} });
    queryOptions = getQueryOptions();

    expect(queryOptions.canLoad()).toBe(false);
    expect(queryOptions.skipContext()).toEqual({
      hasAppletsApi: true,
      packageName: null,
      uuid: null
    });
    await expect(queryOptions.load()).rejects.toThrow('Missing applet identifier');
  });

  it('reloads when a loadable route identifier changes', async () => {
    const reload = vi.fn();
    await mountDetailPage({
      queryState: createQueryState({ reload }),
      routeParams: { packageName: 'weather' }
    });

    setRouteParams({ packageName: 'clock' });
    await nextTick();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload on route changes while the page cannot load applets', async () => {
    const reload = vi.fn();
    await mountDetailPage({
      isConnected: false,
      queryState: createQueryState({ reload }),
      routeParams: { packageName: 'weather' }
    });

    setRouteParams({ packageName: 'clock' });
    await nextTick();

    expect(reload).not.toHaveBeenCalled();
  });
});

async function mountDetailPage(
  options: {
    hasAppletsApi?: boolean;
    isConnected?: boolean;
    queryState?: QueryState;
    routeParams?: RouteParams;
  } = {}
): Promise<VueWrapper> {
  resetDetailPageMocks(options);
  const { default: DetailPage } = await import('@/pages/Applets/DetailPage.vue');

  const wrapper = mount(DetailPage, {
    global: {
      stubs: detailPageStubs()
    }
  });

  await settleVueUpdates();

  return wrapper;
}

async function settleVueUpdates(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

function resetDetailPageMocks(options: {
  hasAppletsApi?: boolean;
  isConnected?: boolean;
  queryState?: QueryState;
  routeParams?: RouteParams;
}): void {
  vi.clearAllMocks();
  detailPageMock.hasAppletsApi = options.hasAppletsApi ?? true;
  detailPageMock.isConnected.value = options.isConnected ?? true;
  detailPageMock.lastError.value = null;
  detailPageMock.notifications.setNotification.mockReset();
  detailPageMock.state.value = 'connected';
  detailPageMock.queryOptions = [];
  detailPageMock.queryState = options.queryState ?? createQueryState();
  detailPageMock.routeParams = options.routeParams ?? { packageName: 'weather' };
  detailPageMock.applets.get.mockResolvedValue(createApplet({ installed: true }));

  if (detailPageMock.route) {
    setRouteParams(detailPageMock.routeParams);
  }
}

function setRouteParams(params: RouteParams): void {
  if (!detailPageMock.route) {
    throw new Error('DetailPage route has not been initialized');
  }

  for (const key of Object.keys(detailPageMock.route.params)) {
    delete detailPageMock.route.params[key];
  }

  Object.assign(detailPageMock.route.params, params);
}

function createQueryState(overrides: Partial<QueryState> = {}): QueryState {
  return {
    data: createApplet({ installed: true }),
    error: '',
    hasAttempted: true,
    isLoading: false,
    isWaitingForPeer: false,
    reload: vi.fn(),
    ...overrides
  };
}

function getQueryOptions(): ControllerQueryOptions {
  const queryOptions = detailPageMock.queryOptions.at(-1);

  if (!queryOptions) {
    throw new Error('DetailPage query options were not registered');
  }

  return queryOptions;
}

function createApplet(options: { installed: boolean }): IFullApplet {
  const applet: IFullApplet = {
    categories: [
      { icon: { alt: 'Weather', iconId: 'cloud' }, key: 'weather' },
      { icon: { alt: 'Clock', iconId: 'clock' }, key: 'clock' }
    ],
    defaultImage: {
      alt: 'Weather preview',
      dateCreated: new Date('2026-01-01T00:00:00.000Z'),
      src: '/weather.webp'
    },
    details: {
      author: 'Pixelrunner',
      desc: 'Weather forecast',
      name: 'Weather',
      summary: 'Forecast'
    },
    fileName: 'weather.star',
    isInstalled: options.installed,
    packageName: 'weather'
  };

  if (options.installed) {
    applet.installationDetails = {
      image: {
        alt: 'Weather installed preview',
        dateCreated: new Date('2026-01-02T00:00:00.000Z'),
        src: '/weather-installed.webp'
      },
      uuid: 'weather-uuid' as UUID
    };
  }

  return applet;
}

function detailPageStubs() {
  return {
    AppletConfig: {
      props: ['applet'],
      template:
        '<section data-testid="config">config:{{ applet.packageName }}:{{ applet.installationDetails?.uuid || "none" }}</section>'
    },
    AppletDetails: {
      props: ['name', 'view'],
      template: '<section data-testid="details">details:{{ name }}:{{ view }}</section>'
    },
    AppletImage: {
      props: {
        alt: String,
        showFrame: Boolean,
        src: String
      },
      template: '<section data-testid="image">image:{{ src }}:{{ alt }}:{{ showFrame }}</section>'
    },
    AppletItem: {
      props: ['applet'],
      template:
        '<article data-testid="item">item:{{ applet.packageName }}<slot name="item" v-bind="applet" /></article>'
    },
    CategoryList: {
      props: {
        categories: Array,
        hasItemsInline: Boolean
      },
      template:
        '<section data-testid="categories">categories:{{ categories.map((category) => category.key).join(",") }}:{{ hasItemsInline }}</section>'
    },
    DebugSection: {
      props: ['data'],
      template:
        '<pre data-testid="debug">debug:{{ data.packageName }}:{{ data.uuid }}:{{ data.loadedPackageName }}:{{ data.loadedUuid }}</pre>'
    },
    FeatureToggle: {
      template: '<section data-testid="feature-toggle"><slot /></section>'
    }
  };
}
