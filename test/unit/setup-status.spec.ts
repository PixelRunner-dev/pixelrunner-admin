import { computed, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { IRpcClient } from '@/ws/api/client.ts';
import type { IEventHandler, IWebSocketEventType } from 'pixelrunner-shared';

type HandlerMap = Partial<Record<IWebSocketEventType, Array<(event: unknown) => void>>>;

function createClient({
  connected = true,
  connecting = false,
  response = {
    databaseExists: true,
    wifiConfigured: true,
    setupRequired: false
  }
}: {
  connected?: boolean;
  connecting?: boolean;
  response?: unknown;
} = {}) {
  const handlers: HandlerMap = {};
  const isConnected = ref(connected);
  const isConnecting = ref(connecting);

  const client = {
    state: ref('disconnected'),
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    lastError: ref(null),
    request: vi.fn().mockResolvedValue(response),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    reconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: IWebSocketEventType, handler: IEventHandler<IWebSocketEventType>) => {
      handlers[event] ??= [];
      handlers[event]?.push(handler as (event: unknown) => void);

      return () => {
        handlers[event] = handlers[event]?.filter((item) => item !== handler);
      };
    }),
    off: vi.fn(),
    once: vi.fn()
  } as unknown as IRpcClient;

  return {
    client,
    emit(event: IWebSocketEventType, payload: unknown) {
      handlers[event]?.forEach((handler) => handler(payload));
    },
    setConnected(value: boolean) {
      isConnected.value = value;
    },
    setConnecting(value: boolean) {
      isConnecting.value = value;
    },
    handlers
  };
}

async function importSetupStatus() {
  vi.resetModules();
  return import('@/services/setup-status.ts');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('setup status service', () => {
  it('throws when the client has not been configured', async () => {
    const { getSetupStatus } = await importSetupStatus();

    await expect(getSetupStatus()).rejects.toThrow('Setup status client has not been configured');
  });

  it('requests setup status immediately when already connected', async () => {
    const { configureSetupStatusClient, getSetupStatus } = await importSetupStatus();
    const { client } = createClient();

    configureSetupStatusClient(client);

    await expect(getSetupStatus()).resolves.toEqual({
      databaseExists: true,
      wifiConfigured: true,
      setupRequired: false
    });
    expect(client.connect).not.toHaveBeenCalled();
    expect(client.request).toHaveBeenCalledWith('device.setupStatus', undefined, {
      signal: expect.any(AbortSignal),
      timeout: 5_000
    });
  });

  it('connects before requesting when disconnected and idle', async () => {
    const { configureSetupStatusClient, getSetupStatus } = await importSetupStatus();
    const { client } = createClient({ connected: false, connecting: false });

    configureSetupStatusClient(client);

    await getSetupStatus();

    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.request).toHaveBeenCalledOnce();
  });

  it('waits for an in-flight connection and unsubscribes listeners', async () => {
    const { configureSetupStatusClient, getSetupStatus } = await importSetupStatus();
    const mock = createClient({ connected: false, connecting: true });

    configureSetupStatusClient(mock.client);

    const statusPromise = getSetupStatus();
    mock.emit('connected', { timestamp: Date.now(), reconnectAttempt: 0 });

    await expect(statusPromise).resolves.toEqual({
      databaseExists: true,
      wifiConfigured: true,
      setupRequired: false
    });
    expect(mock.client.connect).not.toHaveBeenCalled();
    expect(mock.handlers.connected).toEqual([]);
    expect(mock.handlers.error).toEqual([]);
  });

  it('rejects if the in-flight connection emits an error', async () => {
    const { configureSetupStatusClient, getSetupStatus } = await importSetupStatus();
    const mock = createClient({ connected: false, connecting: true });
    const error = new Error('connection failed');

    configureSetupStatusClient(mock.client);

    const statusPromise = getSetupStatus();
    mock.emit('error', { error, fatal: true });

    await expect(statusPromise).rejects.toThrow(error);
    expect(mock.client.request).not.toHaveBeenCalled();
    expect(mock.handlers.connected).toEqual([]);
    expect(mock.handlers.error).toEqual([]);
  });

  it('aborts the request timeout and clears the timer in finally', async () => {
    vi.useFakeTimers();
    const { configureSetupStatusClient, getSetupStatus } = await importSetupStatus();
    const { client } = createClient();

    client.request = vi.fn(
      (_method, _params, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    ) as IRpcClient['request'];

    configureSetupStatusClient(client);

    const statusError = getSetupStatus().catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(5_000);

    const error = await statusError;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('aborted');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns setup required from the fetched status', async () => {
    const { configureSetupStatusClient, isSetupRequired } = await importSetupStatus();
    const { client } = createClient({
      response: {
        databaseExists: false,
        wifiConfigured: false,
        setupRequired: true
      }
    });

    configureSetupStatusClient(client);

    await expect(isSetupRequired()).resolves.toBe(true);
  });

  it('redirects to setup when the database is missing', async () => {
    const { configureSetupStatusClient, getSetupRedirect } = await importSetupStatus();
    const { client } = createClient({
      response: {
        databaseExists: false,
        wifiConfigured: false,
        setupRequired: true
      }
    });

    configureSetupStatusClient(client);

    await expect(getSetupRedirect({ name: 'applet-list', query: {} })).resolves.toEqual({
      name: 'setup'
    });
    await expect(getSetupRedirect({ name: 'setup', query: {} })).resolves.toBeNull();
  });

  it('redirects first-time settings when wifi is missing', async () => {
    const { configureSetupStatusClient, getSetupRedirect } = await importSetupStatus();
    const { client } = createClient({
      response: {
        databaseExists: true,
        wifiConfigured: false,
        setupRequired: true
      }
    });

    configureSetupStatusClient(client);

    await expect(getSetupRedirect({ name: 'applet-list', query: {} })).resolves.toEqual({
      name: 'settings',
      query: { 'first-time': '1' }
    });
    await expect(
      getSetupRedirect({ name: 'settings', query: { 'first-time': '1' } })
    ).resolves.toBeNull();
  });

  it('redirects away from setup after database and wifi are configured', async () => {
    const { configureSetupStatusClient, getSetupRedirect } = await importSetupStatus();
    const { client } = createClient();

    configureSetupStatusClient(client);

    await expect(getSetupRedirect({ name: 'setup', query: {} })).resolves.toEqual({
      name: 'applet-list'
    });
    await expect(getSetupRedirect({ name: 'settings', query: {} })).resolves.toBeNull();
  });
});
