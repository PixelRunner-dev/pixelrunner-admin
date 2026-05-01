import { nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';

import { useControllerQuery } from '@/composables/useControllerQuery.ts';

import type { SettingsAPIInstance } from '@/ws/composables/use-client.ts';

const DEFAULT_SETTINGS_SAVE_DEBOUNCE_MS = 300;

export type SyncedControllerSettingValue = unknown;

export interface SyncedControllerSettingBinding {
  key: string;
  model: Ref<unknown>;
}

interface SyncedControllerSettingsOptions {
  settings: SettingsAPIInstance | null;
  isConnected: ComputedRef<boolean>;
  state: Ref<unknown>;
  lastError: Ref<Error | null>;
  bindings: SyncedControllerSettingBinding[];
  saveDebounceMs?: number;
  retryDelayMs?: number;
}

export function serializeSettingValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function parseSettingValue(rawValue: string, currentValue: unknown): SyncedControllerSettingValue {
  if (typeof currentValue === 'boolean') {
    return rawValue === 'true';
  }

  if (typeof currentValue === 'number') {
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : currentValue;
  }

  if (typeof currentValue === 'object' || rawValue.startsWith('{') || rawValue.startsWith('[')) {
    try {
      return JSON.parse(rawValue) as Record<string, unknown>;
    } catch {
      return currentValue;
    }
  }

  return rawValue;
}

export function useSyncedControllerSettings(options: SyncedControllerSettingsOptions) {
  const isApplyingControllerSettings = ref(false);
  const hasLoadedSettings = ref(false);
  const pendingSettingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const settingsByKey = new Map(options.bindings.map((binding) => [binding.key, binding]));
  const saveDebounceMs = options.saveDebounceMs ?? DEFAULT_SETTINGS_SAVE_DEBOUNCE_MS;

  function clearPendingSettingTimers() {
    pendingSettingTimers.forEach((timer) => clearTimeout(timer));
    pendingSettingTimers.clear();
  }

  function applySettings(records: Awaited<ReturnType<SettingsAPIInstance['getAll']>>) {
    isApplyingControllerSettings.value = true;

    records.forEach((setting) => {
      const binding = settingsByKey.get(setting.key);
      if (!binding) {
        return;
      }

      binding.model.value = parseSettingValue(setting.value, binding.model.value);
    });

    hasLoadedSettings.value = true;
    void nextTick(() => {
      isApplyingControllerSettings.value = false;
    });
  }

  function queueSettingSave(key: string, value: unknown) {
    if (
      !options.settings ||
      !options.isConnected.value ||
      !hasLoadedSettings.value ||
      isApplyingControllerSettings.value
    ) {
      return;
    }

    const existingTimer = pendingSettingTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      pendingSettingTimers.delete(key);

      try {
        await options.settings?.set(key, serializeSettingValue(value));
        console.log('[SettingsPage] Saved device setting:', key);
      } catch (error) {
        console.error('[SettingsPage] Failed to save device setting:', key, error);
      }
    }, saveDebounceMs);

    pendingSettingTimers.set(key, timer);
  }

  const query = useControllerQuery({
    label: 'SettingsPage',
    enabled: options.isConnected,
    state: options.state,
    lastError: options.lastError,
    retryDelayMs: options.retryDelayMs,
    canLoad: () => Boolean(options.settings),
    skipContext: () => ({ hasSettingsApi: Boolean(options.settings) }),
    load: async () => {
      if (!options.settings) {
        return [];
      }

      return options.settings.getAll();
    },
    defaultErrorMessage: 'Failed to load device settings',
    onSuccess: applySettings
  });

  watch(options.isConnected, (connected) => {
    if (!connected) {
      clearPendingSettingTimers();
      hasLoadedSettings.value = false;
    }
  });

  options.bindings.forEach(({ key, model }) => {
    watch(
      model,
      (value) => {
        queueSettingSave(key, value);
      },
      { deep: true }
    );
  });

  onBeforeUnmount(() => {
    clearPendingSettingTimers();
  });

  return {
    ...query,
    hasLoadedSettings,
    isApplyingControllerSettings,
    clearPendingSettingTimers
  };
}
