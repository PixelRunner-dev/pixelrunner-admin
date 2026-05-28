import { afterEach, describe, expect, it, vi } from 'vitest';

type MockClient = {
  connect: ReturnType<typeof vi.fn>;
  isConnected: { value: boolean };
  isConnecting: { value: boolean };
  kind: string;
  listeners: Map<string, (event: unknown) => void>;
  on: ReturnType<typeof vi.fn>;
  options?: unknown;
  request: ReturnType<typeof vi.fn>;
};

const mainMock = vi.hoisted(() => {
  const app = {
    mount: vi.fn(),
    provide: vi.fn(),
    use: vi.fn()
  };

  app.provide.mockReturnValue(app);
  app.use.mockReturnValue(app);
  app.mount.mockReturnValue(app);

  return {
    app,
    clients: [] as MockClient[],
    configureSetupStatusClient: vi.fn(),
    cookieGet: vi.fn(),
    cookieHas: vi.fn(),
    createApp: vi.fn(() => app),
    detectAccessMode: vi.fn(),
    fetchProxyRoomConfig: vi.fn(),
    getFallbackRoomId: vi.fn(),
    i18NextVue: { name: 'I18NextVuePlugin' },
    i18next: {
      changeLanguage: vi.fn(),
      init: vi.fn()
    },
    markAsViaProxy: vi.fn(),
    mockRpcClient: vi.fn(function MockRpcClient() {
      return createMockClient('mock');
    }),
    requiresProxyConnection: vi.fn(),
    router: { name: 'router' },
    trysteroClient: vi.fn(function TrysteroWebRTCClient(options?: unknown) {
      return createMockClient('trystero', options);
    }),
    webSocketClient: vi.fn(function WebSocketClient(options?: unknown) {
      return createMockClient('websocket', options);
    }),
    wsInjectionKey: Symbol('ws')
  };

  function createMockClient(kind: string, options?: unknown): MockClient {
    const listeners = new Map<string, (event: unknown) => void>();
    const client: MockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      isConnected: { value: false },
      isConnecting: { value: false },
      kind,
      listeners,
      on: vi.fn((event: string, handler: (event: unknown) => void) => {
        listeners.set(event, handler);
        return vi.fn();
      }),
      options,
      request: vi.fn()
    };

    mainMock.clients.push(client);

    return client;
  }
});

vi.mock('../../src/crypto-polyfill.ts', () => ({}));

vi.mock('vue', () => ({
  createApp: mainMock.createApp
}));

vi.mock('i18next', () => ({
  default: mainMock.i18next
}));

vi.mock('i18next-vue', () => ({
  default: mainMock.i18NextVue
}));

vi.mock('../../src/App.vue', () => ({
  default: { name: 'MockApp' }
}));

vi.mock('../../src/router/index.ts', () => ({
  default: mainMock.router
}));

vi.mock('@/utils/CookieStore.ts', () => ({
  CookieStore: {
    get: mainMock.cookieGet,
    has: mainMock.cookieHas
  }
}));

vi.mock('@/services/setup-status.ts', () => ({
  configureSetupStatusClient: mainMock.configureSetupStatusClient
}));

vi.mock('@/ws/index.ts', () => ({
  WS_INJECTION_KEY: mainMock.wsInjectionKey,
  WebSocketClient: mainMock.webSocketClient
}));

vi.mock('@/ws/trystero-client.ts', () => ({
  TrysteroWebRTCClient: mainMock.trysteroClient
}));

vi.mock('@/mocks/mock-rpc-client.ts', () => ({
  MockRpcClient: mainMock.mockRpcClient
}));

vi.mock('@/ws/room-id.ts', () => ({
  fetchProxyRoomConfig: mainMock.fetchProxyRoomConfig,
  getFallbackRoomId: mainMock.getFallbackRoomId
}));

vi.mock('@/utils/access-detector.ts', () => ({
  detectAccessMode: mainMock.detectAccessMode,
  markAsViaProxy: mainMock.markAsViaProxy,
  requiresProxyConnection: mainMock.requiresProxyConnection
}));

describe('main bootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
    document.documentElement.removeAttribute('data-theme');
    window.history.replaceState({}, '', '/');
  });

  it('initializes i18n, mock controller mode, app providers, theme and language cookies', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await importMain({
      accessMode: 'proxy',
      cookieValues: { language: 'nl', theme: 'retro' },
      hasCookies: { theme: true },
      mockController: true,
      search: '?via=proxy'
    });

    const client = latestClient();
    const i18nOptions = mainMock.i18next.init.mock.calls[0]?.[0];

    expect(i18nOptions).toEqual(
      expect.objectContaining({
        fallbackNS: 'translation',
        lng: 'en',
        resources: expect.objectContaining({
          de: expect.any(Object),
          en: expect.any(Object),
          es: expect.any(Object),
          fr: expect.any(Object),
          nl: expect.any(Object)
        })
      })
    );
    expect(document.documentElement.dataset.theme).toBe('retro');
    expect(mainMock.markAsViaProxy).toHaveBeenCalledOnce();
    expect(mainMock.mockRpcClient).toHaveBeenCalledOnce();
    expect(mainMock.configureSetupStatusClient).toHaveBeenCalledWith(client);
    expect(mainMock.app.provide).toHaveBeenCalledWith(mainMock.wsInjectionKey, client);
    expect(mainMock.app.provide).toHaveBeenCalledWith('accessMode', 'proxy');
    expect(mainMock.app.use).toHaveBeenCalledWith(mainMock.i18NextVue, {
      i18next: mainMock.i18next
    });
    expect(mainMock.app.use).toHaveBeenCalledWith(mainMock.router);
    expect(mainMock.app.mount).toHaveBeenCalledWith('#app');
    expect(client.connect).toHaveBeenCalledOnce();
    expect(mainMock.i18next.changeLanguage).toHaveBeenCalledWith('nl');

    client.listeners.get('connected')?.({ peerId: 'device' });
    client.listeners.get('disconnected')?.({ reason: 'manual' });
    client.listeners.get('reconnecting')?.({ attempt: 2 });
    client.listeners.get('error')?.({ error: new Error('transport failed') });

    expect(consoleLog).toHaveBeenCalledWith('[main] Client connected:', { peerId: 'device' });
    expect(consoleLog).toHaveBeenCalledWith('[main] Client disconnected:', { reason: 'manual' });
    expect(consoleLog).toHaveBeenCalledWith('[main] Client reconnecting:', { attempt: 2 });
    expect(consoleError).toHaveBeenCalledWith('[main] Client error:', expect.any(Error));
  });

  it('uses a same-origin WebSocket bridge when proxy access exposes a controller path', async () => {
    await importMain({
      proxyRoomConfig: { controllerWebSocketPath: '/ws/controller' },
      requiresProxy: true
    });

    expect(mainMock.webSocketClient).toHaveBeenCalledWith({
      debug: expect.any(Boolean),
      reconnect: true,
      url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
        window.location.host
      }/ws/controller`
    });
    expect(mainMock.trysteroClient).not.toHaveBeenCalled();
  });

  it('uses a secure WebSocket bridge when proxy access is served over HTTPS', async () => {
    stubWindowLocation('https://pixelrunner.local/admin');

    await importMain({
      proxyRoomConfig: { controllerWebSocketPath: '/ws/controller' },
      requiresProxy: true
    });

    expect(mainMock.webSocketClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'wss://pixelrunner.local/ws/controller'
      })
    );
  });

  it('uses Trystero for proxy access when no controller WebSocket path is available', async () => {
    await importMain({
      fallbackRoomId: 'fallback-from-device',
      proxyRoomConfig: {
        fallbackRoomId: 'fallback-from-proxy',
        roomId: 'proxy-room',
        roomPassword: 'room-password'
      },
      requiresProxy: true
    });

    expect(mainMock.trysteroClient).toHaveBeenCalledWith({
      debug: expect.any(Boolean),
      fallbackRoomId: 'fallback-from-proxy',
      reconnect: true,
      relayUrls: expect.any(Array),
      roomId: 'proxy-room',
      roomPassword: 'room-password'
    });
    expect(mainMock.getFallbackRoomId).not.toHaveBeenCalled();
  });

  it('uses the fallback room id when proxy access has no room config', async () => {
    await importMain({
      fallbackRoomId: 'fallback-room',
      proxyRoomConfig: null,
      requiresProxy: true
    });

    expect(mainMock.trysteroClient).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackRoomId: 'fallback-room',
        reconnect: true,
        roomId: undefined,
        roomPassword: undefined
      })
    );
    expect(mainMock.getFallbackRoomId).toHaveBeenCalledOnce();
  });

  it('uses the development WebSocket URL and reports connect failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await importMain({
      connectError: new Error('connection refused'),
      requiresProxy: false
    });

    expect(mainMock.webSocketClient).toHaveBeenCalledWith({
      debug: expect.any(Boolean),
      reconnect: true,
      url: `ws://${window.location.hostname}:8765`
    });
    expect(latestClient().connect).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to connect to WebSocket:',
      expect.any(Error)
    );
  });

  it('falls back to the default theme and skips optional cookie side effects', async () => {
    await importMain({
      cookieValues: { theme: null },
      hasCookies: { theme: true },
      requiresProxy: false
    });

    expect(document.documentElement.dataset.theme).toBe('pixelrunner');
    expect(mainMock.i18next.changeLanguage).not.toHaveBeenCalled();
    expect(mainMock.markAsViaProxy).not.toHaveBeenCalled();
  });
});

async function importMain(options: {
  accessMode?: string;
  connectError?: Error;
  cookieValues?: Record<string, string | null>;
  fallbackRoomId?: string;
  hasCookies?: Record<string, boolean>;
  mockController?: boolean;
  proxyRoomConfig?: Record<string, string> | null;
  requiresProxy?: boolean;
  search?: string;
} = {}): Promise<void> {
  resetMainMocks(options);
  vi.stubEnv('VITE_MOCK_CONTROLLER', options.mockController ? 'true' : 'false');

  if (options.search) {
    window.history.replaceState({}, '', options.search);
  }

  await import(/* @vite-ignore */ getMainModulePath());
  await flushMainPromises();
}

function resetMainMocks(options: {
  accessMode?: string;
  connectError?: Error;
  cookieValues?: Record<string, string | null>;
  fallbackRoomId?: string;
  hasCookies?: Record<string, boolean>;
  proxyRoomConfig?: Record<string, string> | null;
  requiresProxy?: boolean;
}): void {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  mainMock.clients = [];
  mainMock.app.provide.mockReturnValue(mainMock.app);
  mainMock.app.use.mockReturnValue(mainMock.app);
  mainMock.app.mount.mockReturnValue(mainMock.app);
  mainMock.i18next.init.mockResolvedValue(undefined);
  mainMock.detectAccessMode.mockReturnValue(options.accessMode ?? 'direct');
  mainMock.requiresProxyConnection.mockReturnValue(options.requiresProxy ?? false);
  mainMock.fetchProxyRoomConfig.mockResolvedValue(options.proxyRoomConfig ?? null);
  mainMock.getFallbackRoomId.mockReturnValue(options.fallbackRoomId ?? 'fallback-room');
  mainMock.cookieHas.mockImplementation((name: string) => options.hasCookies?.[name] ?? false);
  mainMock.cookieGet.mockImplementation((name: string) => options.cookieValues?.[name] ?? null);

  const connectError = options.connectError;
  mainMock.webSocketClient.mockImplementation(function WebSocketClient(options?: unknown) {
    const client = createMockClient('websocket', options);
    if (connectError) {
      client.connect.mockRejectedValue(connectError);
    }
    return client;
  });
  mainMock.trysteroClient.mockImplementation(function TrysteroWebRTCClient(options?: unknown) {
    const client = createMockClient('trystero', options);
    if (connectError) {
      client.connect.mockRejectedValue(connectError);
    }
    return client;
  });
  mainMock.mockRpcClient.mockImplementation(function MockRpcClient() {
    const client = createMockClient('mock');
    if (connectError) {
      client.connect.mockRejectedValue(connectError);
    }
    return client;
  });
}

function createMockClient(kind: string, options?: unknown): MockClient {
  const listeners = new Map<string, (event: unknown) => void>();
  const client: MockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    isConnected: { value: false },
    isConnecting: { value: false },
    kind,
    listeners,
    on: vi.fn((event: string, handler: (event: unknown) => void) => {
      listeners.set(event, handler);
      return vi.fn();
    }),
    options,
    request: vi.fn()
  };

  mainMock.clients.push(client);

  return client;
}

async function flushMainPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function latestClient(): MockClient {
  const client = mainMock.clients.at(-1);

  if (!client) {
    throw new Error('No client was created');
  }

  return client;
}

function getMainModulePath(): string {
  return '../../src/main.ts';
}

function stubWindowLocation(url: string): void {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: new URL(url)
  });
}
