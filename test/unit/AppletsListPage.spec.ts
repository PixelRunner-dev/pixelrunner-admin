import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { IInstalledApplet, IPlaylist, UUID } from 'pixelrunner-shared';

type QueryState = {
  data?: IPlaylist;
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
  onSuccess?: (playlist: IPlaylist) => void;
  skipContext: () => Record<string, unknown>;
};

const listPageMock = vi.hoisted(() => ({
  hasPlaylistsApi: true,
  isConnected: { __v_isRef: true, value: true },
  lastError: { __v_isRef: true, value: null as Error | null },
  notifications: {
    setNotification: vi.fn()
  },
  playlists: {
    activePlaylist: vi.fn(),
    updateOrder: vi.fn()
  },
  queryOptions: [] as ControllerQueryOptions[],
  queryState: undefined as QueryState | undefined,
  state: { __v_isRef: true, value: 'connected' }
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    isConnected: listPageMock.isConnected,
    lastError: listPageMock.lastError,
    playlists: listPageMock.hasPlaylistsApi ? listPageMock.playlists : null,
    state: listPageMock.state
  })
}));

vi.mock('@/composables/useNotifications.ts', () => ({
  useNotifications: () => listPageMock.notifications
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn((options: ControllerQueryOptions) => {
    listPageMock.queryOptions.push(options);
    const state = listPageMock.queryState ?? createQueryState();

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

vi.mock('@/utils/generic.ts', () => ({
  vibrateDevice: vi.fn()
}));

describe('Applets ListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('configures the active playlist query and reports successful playlist loads', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const playlist = createPlaylist({ applets: [] });

    await mountListPage();
    listPageMock.playlists.activePlaylist.mockResolvedValue(playlist);

    const queryOptions = getQueryOptions();

    expect(queryOptions.label).toBe('ListPage');
    expect(queryOptions.defaultErrorMessage).toBe('Failed to load active playlist');
    expect(queryOptions.canLoad()).toBe(true);
    expect(queryOptions.skipContext()).toEqual({ hasPlaylistsApi: true });
    await expect(queryOptions.load()).resolves.toBe(playlist);
    queryOptions.onSuccess?.(playlist);
    queryOptions.onSuccess?.(createPlaylist());

    expect(listPageMock.playlists.activePlaylist).toHaveBeenCalledOnce();
    expect(consoleLog).toHaveBeenCalledWith('[ListPage] Active playlist applet count:', 0);
    expect(consoleLog).toHaveBeenCalledWith('[ListPage] Active playlist applet count:', 2);
    expect(consoleWarn).toHaveBeenCalledWith(
      '[ListPage] Active playlist received but contains no applets'
    );
    expect(consoleWarn).toHaveBeenCalledOnce();
  });

  it('renders the playlist, library shortcut, debug state and touch feedback', async () => {
    const { vibrateDevice } = await import('@/utils/generic.ts');
    const wrapper = await mountListPage();

    expect(wrapper.text()).toContain('t:listPage.pageTitle');
    expect(wrapper.text()).toContain('playlist:Main List');
    expect(wrapper.text()).toContain('order:clock,weather');
    expect(wrapper.text()).toContain('saving:false');
    expect(wrapper.text()).toContain('debug:Main List:2:false');
    expect(wrapper.get('[data-testid="library-link"]').attributes('href')).toBe('/library');
    expect(wrapper.get('[data-testid="library-link"]').text()).toContain(
      't:listPage.cta.goToLibrary'
    );

    await wrapper.get('[data-testid="library-link"]').trigger('touchstart');
    await wrapper.get('[data-testid="library-link"]').trigger('touchend');

    expect(vibrateDevice).toHaveBeenCalledWith(4);
    expect(vibrateDevice).toHaveBeenCalledWith(1);

    wrapper.unmount();
    expect(listPageMock.notifications.setNotification).not.toHaveBeenCalled();
  });

  it('shows and cleans up loading, waiting and load error notifications', async () => {
    const loading = await mountListPage({
      queryState: createQueryState({ data: undefined, isLoading: true })
    });

    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { message: 'Loading active playlist...', type: 'info' },
      { delay: 500 }
    );

    loading.unmount();
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(false, {
      message: 'Loading active playlist...',
      type: 'info'
    });

    await mountListPage({
      queryState: createQueryState({ data: undefined, isWaitingForPeer: true })
    });
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { message: 'Waiting for device connection...', type: 'info' },
      { delay: 500 }
    );

    await mountListPage({
      queryState: createQueryState({ data: undefined, error: 'load failed' })
    });
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { hasCloseButton: true, message: 'load failed', type: 'error' },
      { delay: 500 }
    );
  });

  it('saves reordered applet UUIDs once and blocks duplicate requests while saving', async () => {
    const updateOrder = createDeferred<void>();
    const wrapper = await mountListPage();
    listPageMock.playlists.updateOrder.mockReturnValue(updateOrder.promise);

    await wrapper.get('[data-testid="reorder-reverse"]').trigger('click');
    await wrapper.get('[data-testid="reorder-reverse"]').trigger('click');
    await flushPromises();

    expect(listPageMock.playlists.updateOrder).toHaveBeenCalledOnce();
    expect(listPageMock.playlists.updateOrder).toHaveBeenCalledWith(['uuid-weather', 'uuid-clock'], {
      timeout: 5000
    });
    expect(wrapper.text()).toContain('order:weather,clock');
    expect(wrapper.text()).toContain('saving:true');
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { message: 'Saving playlist order...', type: 'info' },
      { delay: 500 }
    );

    updateOrder.resolve();
    await flushPromises();

    expect(wrapper.text()).toContain('order:weather,clock');
    expect(wrapper.text()).toContain('saving:false');
  });

  it('reloads and reports an error when reordered applets are missing installation UUIDs', async () => {
    const reload = vi.fn();
    const wrapper = await mountListPage({
      queryState: createQueryState({ data: createPlaylist(), reload })
    });

    await wrapper.get('[data-testid="reorder-missing-uuid"]').trigger('click');
    await flushPromises();

    expect(listPageMock.playlists.updateOrder).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      {
        hasCloseButton: true,
        message: 'Cannot save playlist order: one or more applets are missing an installation UUID.',
        type: 'error'
      },
      { delay: 500 }
    );
  });

  it('restores the previous playlist and shows API error messages when saving fails', async () => {
    const wrapper = await mountListPage();
    listPageMock.playlists.updateOrder.mockRejectedValue(new Error('update failed'));

    await wrapper.get('[data-testid="reorder-reverse"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('order:clock,weather');
    expect(wrapper.text()).toContain('saving:false');
    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { hasCloseButton: true, message: 'update failed', type: 'error' },
      { delay: 500 }
    );
  });

  it('falls back to a generic save error and refuses to load without the playlist API', async () => {
    const wrapper = await mountListPage();
    listPageMock.playlists.updateOrder.mockRejectedValue('network unavailable');

    await wrapper.get('[data-testid="reorder-reverse"]').trigger('click');
    await flushPromises();

    expect(listPageMock.notifications.setNotification).toHaveBeenLastCalledWith(
      true,
      { hasCloseButton: true, message: 'Failed to save playlist order', type: 'error' },
      { delay: 500 }
    );

    await mountListPage({ hasPlaylistsApi: false });
    const queryOptions = getQueryOptions();

    expect(queryOptions.canLoad()).toBe(false);
    expect(queryOptions.skipContext()).toEqual({ hasPlaylistsApi: false });
    await expect(queryOptions.load()).rejects.toThrow('Playlists API not available');
  });

  it('does not render or save playlist changes when no active playlist is loaded', async () => {
    const wrapper = await mountListPage({
      queryState: createQueryState({ data: undefined })
    });

    expect(wrapper.find('[data-testid="playlist"]').exists()).toBe(false);
    expect(listPageMock.playlists.updateOrder).not.toHaveBeenCalled();
  });
});

async function mountListPage(options: {
  hasPlaylistsApi?: boolean;
  queryState?: QueryState;
} = {}): Promise<VueWrapper> {
  resetListPageMocks(options);
  const { default: ListPage } = await import('@/pages/Applets/ListPage.vue');

  const wrapper = mount(ListPage, {
    global: {
      mocks: {
        $t: (key: string) => `t:${key}`
      },
      stubs: listPageStubs()
    }
  });

  await flushPromises();

  return wrapper;
}

function resetListPageMocks(options: {
  hasPlaylistsApi?: boolean;
  queryState?: QueryState;
} = {}): void {
  vi.clearAllMocks();
  listPageMock.hasPlaylistsApi = options.hasPlaylistsApi ?? true;
  listPageMock.isConnected.value = true;
  listPageMock.lastError.value = null;
  listPageMock.state.value = 'connected';
  listPageMock.queryOptions = [];
  listPageMock.queryState = options.queryState ?? createQueryState({ data: createPlaylist() });
  listPageMock.playlists.activePlaylist.mockResolvedValue(createPlaylist());
  listPageMock.playlists.updateOrder.mockResolvedValue(undefined);
}

function createQueryState(overrides: Partial<QueryState> = {}): QueryState {
  return {
    data: createPlaylist(),
    error: '',
    hasAttempted: true,
    isLoading: false,
    isWaitingForPeer: false,
    reload: vi.fn(),
    ...overrides
  };
}

function getQueryOptions(): ControllerQueryOptions {
  const queryOptions = listPageMock.queryOptions.at(-1);

  if (!queryOptions) {
    throw new Error('ListPage query options were not registered');
  }

  return queryOptions;
}

function createPlaylist(overrides: Partial<IPlaylist> = {}): IPlaylist {
  return {
    applets: [createInstalledApplet('clock', 'Clock'), createInstalledApplet('weather', 'Weather')],
    dateCreated: new Date('2026-01-01T00:00:00.000Z'),
    dateModified: new Date('2026-01-02T00:00:00.000Z'),
    name: 'Main List',
    uuid: 'playlist-uuid' as UUID,
    ...overrides
  };
}

function createInstalledApplet(packageName: string, name: string): IInstalledApplet {
  return {
    categories: [],
    defaultImage: {
      alt: name,
      dateCreated: new Date('2026-01-01T00:00:00.000Z'),
      src: `/${packageName}.webp`
    },
    details: {
      author: 'Pixelrunner',
      desc: `${name} description`,
      name,
      summary: `${name} summary`
    },
    fileName: `${packageName}.star`,
    installationDetails: {
      image: {
        alt: name,
        dateCreated: new Date('2026-01-02T00:00:00.000Z'),
        src: `/${packageName}-installed.webp`
      },
      uuid: `uuid-${packageName}` as UUID
    },
    isInstalled: true,
    packageName
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function listPageStubs() {
  return {
    DebugSection: {
      props: ['data'],
      template:
        '<pre data-testid="debug-section">debug:{{ data.playlistName }}:{{ data.playlistAppletCount }}:{{ data.isSavingOrder.value }}</pre>'
    },
    DText: {
      props: ['is'],
      template: '<component :is="is || `span`"><slot /></component>'
    },
    FeatureToggle: {
      template: '<div><slot /></div>'
    },
    PlayList: {
      emits: ['reorder'],
      props: ['applets', 'isSavingOrder', 'name'],
      template: `
        <section data-testid="playlist">
          <p>playlist:{{ name }}</p>
          <p>order:{{ applets.map((applet) => applet.packageName).join(',') }}</p>
          <p>saving:{{ isSavingOrder }}</p>
          <button
            data-testid="reorder-reverse"
            type="button"
            @click="$emit('reorder', [...applets].reverse())"
          >
            reorder
          </button>
          <button
            data-testid="reorder-missing-uuid"
            type="button"
            @click="$emit('reorder', [{ ...applets[0], installationDetails: undefined }, applets[1]])"
          >
            missing uuid
          </button>
        </section>
      `
    },
    RouterLink: {
      emits: ['touchend', 'touchstart'],
      props: ['to'],
      template:
        '<a data-testid="library-link" :href="to" @touchstart="$emit(\'touchstart\', $event)" @touchend="$emit(\'touchend\', $event)"><slot /></a>'
    }
  };
}
