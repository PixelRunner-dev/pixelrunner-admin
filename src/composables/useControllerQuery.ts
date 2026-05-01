import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';

import { JsonRpcError } from '@/ws/index.ts';

const DEFAULT_CONTROLLER_RETRY_DELAY_MS = 2000;

type LoadContext = Record<string, unknown>;

interface ControllerQueryOptions<TData> {
  label: string;
  enabled: Ref<boolean> | ComputedRef<boolean>;
  state?: Ref<unknown>;
  lastError?: Ref<Error | null>;
  load: () => Promise<TData>;
  canLoad?: () => boolean;
  skipContext?: () => LoadContext;
  retryDelayMs?: number;
  transientErrorMessage?: string;
  defaultErrorMessage?: string;
  clearDataOnError?: boolean;
  shouldReloadOnEnabled?: (data: TData | undefined) => boolean;
  onSuccess?: (data: TData) => void;
}

export function isTransientControllerError(error: unknown): boolean {
  if (error instanceof JsonRpcError) {
    return error.code === 'service_unavailable';
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('Controller unavailable') ||
    error.message.includes('Controller socket not available')
  );
}

export function useControllerQuery<TData>(options: ControllerQueryOptions<TData>) {
  const data = ref<TData>();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasAttempted = ref(false);
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const retryDelayMs = options.retryDelayMs ?? DEFAULT_CONTROLLER_RETRY_DELAY_MS;
  const transientErrorMessage = options.transientErrorMessage ?? 'Waiting for device controller...';
  const defaultErrorMessage = options.defaultErrorMessage ?? 'Failed to load data';
  const clearDataOnError = options.clearDataOnError ?? true;
  const shouldReloadOnEnabled = options.shouldReloadOnEnabled ?? ((currentData) => !currentData);

  const isWaitingForPeer = computed(
    () =>
      !data.value &&
      !isLoading.value &&
      !error.value &&
      (options.state?.value === 'connecting' ||
        options.state?.value === 'reconnecting' ||
        !hasAttempted.value)
  );

  function clearRetryTimer() {
    if (!retryTimer) {
      return;
    }

    clearTimeout(retryTimer);
    retryTimer = null;
  }

  function scheduleRetry() {
    if (retryTimer || !options.enabled.value) {
      return;
    }

    retryTimer = setTimeout(() => {
      retryTimer = null;
      void reload();
    }, retryDelayMs);
  }

  async function reload() {
    if (!options.enabled.value || isLoading.value || options.canLoad?.() === false) {
      console.log(`[${options.label}] Skipping controller load`, {
        isConnected: options.enabled.value,
        isLoading: isLoading.value,
        ...options.skipContext?.()
      });
      return;
    }

    isLoading.value = true;
    error.value = null;
    hasAttempted.value = true;
    clearRetryTimer();
    console.log(`[${options.label}] Requesting controller data`);

    try {
      const result = await options.load();
      console.log(`[${options.label}] Controller response:`, result);
      data.value = result;
      options.onSuccess?.(result);
    } catch (loadError) {
      if (clearDataOnError) {
        data.value = undefined;
      }

      if (isTransientControllerError(loadError)) {
        error.value = transientErrorMessage;
        scheduleRetry();
      } else {
        error.value = loadError instanceof Error ? loadError.message : defaultErrorMessage;
      }
      console.error(`[${options.label}] Failed to load controller data:`, loadError);
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    options.enabled,
    (enabled) => {
      console.log(`[${options.label}] Connection state changed:`, enabled);
      if (!enabled) {
        clearRetryTimer();
      }

      if (enabled && shouldReloadOnEnabled(data.value)) {
        void reload();
      }
    },
    { immediate: true }
  );

  if (options.state) {
    watch(options.state, (nextState) => {
      console.log(`[${options.label}] Client state changed:`, nextState, {
        isConnected: options.enabled.value,
        lastError: options.lastError?.value?.message ?? null
      });
    });
  }

  if (options.lastError) {
    watch(options.lastError, (lastError) => {
      if (!lastError) return;
      console.error(`[${options.label}] Client error observed:`, lastError);
    });
  }

  onBeforeUnmount(() => {
    clearRetryTimer();
  });

  return {
    data,
    isLoading,
    error,
    hasAttempted,
    isWaitingForPeer,
    reload,
    clearRetryTimer
  };
}
