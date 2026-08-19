import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed, defineComponent, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isTransientControllerError,
  useControllerQuery
} from '@/composables/useControllerQuery.ts';
import { JsonRpcError } from '@/ws/index.ts';

type QueryResult<TData> = ReturnType<typeof useControllerQuery<TData>>;

describe('isTransientControllerError', () => {
  it('detects transient controller errors from RPC codes and controller messages', () => {
    expect(isTransientControllerError(new JsonRpcError('busy', 'service_unavailable'))).toBe(true);
    expect(isTransientControllerError(new JsonRpcError('missing', 'not_found'))).toBe(false);
    expect(isTransientControllerError(new Error('connect ECONNREFUSED /tmp/controller.sock'))).toBe(
      true
    );
    expect(isTransientControllerError(new Error('Controller unavailable'))).toBe(true);
    expect(isTransientControllerError(new Error('Controller socket not available'))).toBe(true);
    expect(isTransientControllerError(new Error('validation failed'))).toBe(false);
    expect(isTransientControllerError('service_unavailable')).toBe(false);
  });
});

describe('useControllerQuery', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads immediately when enabled and stores the successful response', async () => {
    const onSuccess = vi.fn();
    const harness = mountControllerQuery({ onSuccess });

    expect(harness.result.isLoading.value).toBe(true);
    await flushPromises();

    expect(harness.load).toHaveBeenCalledOnce();
    expect(harness.result.data.value).toBe('controller-data');
    expect(harness.result.error.value).toBeNull();
    expect(harness.result.hasAttempted.value).toBe(true);
    expect(harness.result.isLoading.value).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith('controller-data');
  });

  it('skips loads while disabled, already loading or blocked by canLoad', async () => {
    const disabled = mountControllerQuery({ enabled: false });
    await flushPromises();
    expect(disabled.load).not.toHaveBeenCalled();
    expect(disabled.result.hasAttempted.value).toBe(false);

    const blocked = mountControllerQuery({ canLoad: () => false });
    await flushPromises();
    expect(blocked.load).not.toHaveBeenCalled();
    expect(blocked.result.hasAttempted.value).toBe(false);

    const pendingLoad = createDeferred<string>();
    const loading = mountControllerQuery({
      load: vi.fn(() => pendingLoad.promise)
    });

    expect(loading.result.isLoading.value).toBe(true);
    await loading.result.reload();

    expect(loading.load).toHaveBeenCalledOnce();
    pendingLoad.resolve('done');
    await flushPromises();
  });

  it('reloads on enable only when the configured reload predicate accepts current data', async () => {
    const harness = mountControllerQuery({ enabled: false });
    await flushPromises();

    harness.enabledSource.value = true;
    await flushPromises();
    expect(harness.load).toHaveBeenCalledOnce();

    harness.enabledSource.value = false;
    await flushPromises();
    harness.enabledSource.value = true;
    await flushPromises();
    expect(harness.load).toHaveBeenCalledOnce();

    const forced = mountControllerQuery({
      enabled: false,
      shouldReloadOnEnabled: () => true
    });
    await flushPromises();

    forced.enabledSource.value = true;
    await flushPromises();
    forced.enabledSource.value = false;
    await flushPromises();
    forced.enabledSource.value = true;
    await flushPromises();

    expect(forced.load).toHaveBeenCalledTimes(2);
  });

  it('reports waiting-for-peer state from connection state and missing attempts', async () => {
    const connecting = mountControllerQuery({ enabled: false, state: 'connecting' });
    expect(connecting.result.isWaitingForPeer.value).toBe(true);

    const reconnecting = mountControllerQuery({ enabled: false, state: 'reconnecting' });
    expect(reconnecting.result.isWaitingForPeer.value).toBe(true);

    const idle = mountControllerQuery({ enabled: false, state: 'connected' });
    expect(idle.result.isWaitingForPeer.value).toBe(true);

    const loaded = mountControllerQuery();
    await flushPromises();
    expect(loaded.result.isWaitingForPeer.value).toBe(false);

    const failed = mountControllerQuery({
      load: vi.fn().mockRejectedValue(new Error('fatal'))
    });
    await flushPromises();
    expect(failed.result.isWaitingForPeer.value).toBe(false);
  });

  it('handles non-transient failures, default messages, and clearDataOnError=false', async () => {
    const error = new Error('fatal load failure');
    const failed = mountControllerQuery({
      load: vi.fn().mockRejectedValue(error)
    });
    await flushPromises();

    expect(failed.result.data.value).toBeUndefined();
    expect(failed.result.error.value).toBe('fatal load failure');

    const fallback = mountControllerQuery({
      defaultErrorMessage: 'Custom default',
      load: vi.fn().mockRejectedValue('not an error')
    });
    await flushPromises();
    expect(fallback.result.error.value).toBe('Custom default');

    const preserved = mountControllerQuery({
      clearDataOnError: false,
      load: vi.fn().mockResolvedValueOnce('initial').mockRejectedValueOnce(new Error('next failed'))
    });
    await flushPromises();

    await preserved.result.reload();
    await flushPromises();

    expect(preserved.result.data.value).toBe('initial');
    expect(preserved.result.error.value).toBe('next failed');
  });

  it('schedules one retry for transient failures and reloads when the timer fires', async () => {
    vi.useFakeTimers();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new JsonRpcError('controller busy', 'service_unavailable'))
      .mockResolvedValueOnce('recovered');
    const harness = mountControllerQuery({
      load,
      retryDelayMs: 25,
      transientErrorMessage: 'Controller warming up'
    });
    await flushPromises();

    expect(harness.result.error.value).toBe('Controller warming up');
    expect(vi.getTimerCount()).toBe(1);

    harness.result.clearRetryTimer();
    expect(vi.getTimerCount()).toBe(0);

    await harness.result.reload();
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(2);
    expect(harness.result.data.value).toBe('recovered');
  });

  it('runs retry timers and does not schedule retries after disconnecting mid-load', async () => {
    vi.useFakeTimers();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('Controller socket not available'))
      .mockResolvedValueOnce('retried');
    const retrying = mountControllerQuery({ load, retryDelayMs: 25 });
    await flushPromises();

    await vi.advanceTimersByTimeAsync(25);
    await flushPromises();

    expect(load).toHaveBeenCalledTimes(2);
    expect(retrying.result.data.value).toBe('retried');

    const pendingLoad = createDeferred<string>();
    const disconnected = mountControllerQuery({
      load: vi.fn(() => pendingLoad.promise),
      retryDelayMs: 25
    });
    disconnected.enabledSource.value = false;
    pendingLoad.reject(new Error('Controller unavailable'));
    await flushPromises();

    expect(disconnected.result.error.value).toBe('Waiting for device controller...');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears retry timers when disabled or unmounted', async () => {
    vi.useFakeTimers();
    const disconnecting = mountControllerQuery({
      load: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      retryDelayMs: 50
    });
    await flushPromises();

    expect(vi.getTimerCount()).toBe(1);
    disconnecting.enabledSource.value = false;
    await flushPromises();
    expect(vi.getTimerCount()).toBe(0);

    const unmounting = mountControllerQuery({
      load: vi.fn().mockRejectedValue(new Error('Controller unavailable')),
      retryDelayMs: 50
    });
    await flushPromises();

    expect(vi.getTimerCount()).toBe(1);
    unmounting.wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('logs client state and last-error watcher changes', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const harness = mountControllerQuery();
    await flushPromises();

    harness.state.value = 'reconnecting';
    await flushPromises();
    harness.lastError.value = null;
    await flushPromises();
    harness.lastError.value = new Error('socket failed');
    await flushPromises();
    harness.lastError.value = null;
    await flushPromises();

    expect(consoleLog).toHaveBeenCalledWith('[TestQuery] Client state changed:', 'reconnecting', {
      isConnected: true,
      lastError: null
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[TestQuery] Client error observed:',
      expect.any(Error)
    );
  });

  it('works without optional state and last-error refs', async () => {
    const harness = mountControllerQuery({
      includeLastError: false,
      includeState: false
    });
    await flushPromises();

    expect(harness.load).toHaveBeenCalledOnce();
    expect(harness.result.data.value).toBe('controller-data');
  });
});

function mountControllerQuery(
  options: {
    canLoad?: () => boolean;
    clearDataOnError?: boolean;
    defaultErrorMessage?: string;
    enabled?: boolean;
    includeLastError?: boolean;
    includeState?: boolean;
    label?: string;
    load?: ReturnType<typeof vi.fn<() => Promise<string>>>;
    onSuccess?: (data: string) => void;
    retryDelayMs?: number;
    shouldReloadOnEnabled?: (data: string | undefined) => boolean;
    state?: string;
    transientErrorMessage?: string;
  } = {}
) {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);

  const enabledSource = ref(options.enabled ?? true);
  const state = ref<unknown>(options.state ?? 'connected');
  const lastError = ref<Error | null>(null);
  const load = options.load ?? vi.fn().mockResolvedValue('controller-data');
  const resultHolder: { current?: QueryResult<string> } = {};

  const Harness = defineComponent({
    setup() {
      resultHolder.current = useControllerQuery<string>({
        canLoad: options.canLoad,
        clearDataOnError: options.clearDataOnError,
        defaultErrorMessage: options.defaultErrorMessage,
        enabled: computed(() => enabledSource.value),
        label: options.label ?? 'TestQuery',
        lastError: options.includeLastError === false ? undefined : lastError,
        load,
        onSuccess: options.onSuccess,
        retryDelayMs: options.retryDelayMs,
        shouldReloadOnEnabled: options.shouldReloadOnEnabled,
        skipContext: () => ({ reason: 'test-skip' }),
        state: options.includeState === false ? undefined : state,
        transientErrorMessage: options.transientErrorMessage
      });

      return () => resultHolder.current?.data.value ?? 'empty';
    }
  });

  const wrapper = mount(Harness);
  const result = resultHolder.current;

  if (!result) {
    throw new Error('Controller query did not initialize');
  }

  return {
    enabledSource,
    lastError,
    load,
    result,
    state,
    wrapper: wrapper as VueWrapper
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
