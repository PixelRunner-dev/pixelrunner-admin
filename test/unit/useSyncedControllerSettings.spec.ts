import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { computed, defineComponent, ref, type Ref } from 'vue';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';

import {
  serializeSettingValue,
  useSyncedControllerSettings
} from '@/composables/useSyncedControllerSettings.ts';

import type { SettingsAPIInstance } from '@/ws/composables/use-client.ts';

import en from '../../translations/en.json';

beforeAll(async () => {
  await i18next.init({ lng: 'en', resources: { en: { translation: en } } });
});

type SettingRecord = {
  key: string;
  value: string;
};

type QueryOptions = {
  canLoad: () => boolean;
  defaultErrorMessage: string;
  label: string;
  load: () => Promise<unknown>;
  onSuccess?: (records: SettingRecord[]) => void;
  retryDelayMs?: number;
  skipContext: () => Record<string, unknown>;
};

type QueryReturn = {
  error: Ref<string>;
  hasAttempted: Ref<boolean>;
  isLoading: Ref<boolean>;
  isWaitingForPeer: Ref<boolean>;
  reload: ReturnType<typeof vi.fn>;
};

type SyncedResult = ReturnType<typeof useSyncedControllerSettings>;

const syncedSettingsMock = vi.hoisted(() => ({
  queryOptions: [] as QueryOptions[],
  queryReturn: null as QueryReturn | null
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn((options: QueryOptions) => {
    syncedSettingsMock.queryOptions.push(options);

    if (!syncedSettingsMock.queryReturn) {
      throw new Error('Query return was not initialized');
    }

    return syncedSettingsMock.queryReturn;
  })
}));

describe('serializeSettingValue', () => {
  it('serializes undefined, strings, objects, arrays and primitives for controller storage', () => {
    expect(serializeSettingValue(undefined)).toBe('');
    expect(serializeSettingValue('already serialized')).toBe('already serialized');
    expect(serializeSettingValue({ city: 'Amsterdam' })).toBe('{"city":"Amsterdam"}');
    expect(serializeSettingValue(['one', 2])).toBe('["one",2]');
    expect(serializeSettingValue(true)).toBe('true');
    expect(serializeSettingValue(42)).toBe('42');
  });
});

describe('useSyncedControllerSettings', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('configures the controller query and loads all settings when an API is available', async () => {
    const harness = mountSyncedSettings({ retryDelayMs: 1234 });
    const queryOptions = getQueryOptions();

    expect(queryOptions.label).toBe('SettingsPage');
    expect(queryOptions.defaultErrorMessage).toBe('Failed to load device settings');
    expect(queryOptions.retryDelayMs).toBe(1234);
    expect(queryOptions.canLoad()).toBe(true);
    expect(queryOptions.skipContext()).toEqual({ hasSettingsApi: true });
    await expect(queryOptions.load()).resolves.toEqual([]);
    expect(harness.settings?.getAll).toHaveBeenCalledOnce();
    expect(harness.result.reload).toBe(syncedSettingsMock.queryReturn?.reload);
    expect(harness.result.error.value).toBe('');

    harness.wrapper.unmount();
  });

  it('returns an empty load result and blocks saves when settings API is unavailable', async () => {
    vi.useFakeTimers();
    const harness = mountSyncedSettings({ settings: null });
    const queryOptions = getQueryOptions();

    expect(queryOptions.canLoad()).toBe(false);
    expect(queryOptions.skipContext()).toEqual({ hasSettingsApi: false });
    await expect(queryOptions.load()).resolves.toEqual([]);

    queryOptions.onSuccess?.([{ key: 'theme', value: 'pixelrunner' }]);
    getModel(harness.models, 'theme').value = 'retro';
    await flushPromises();
    await vi.runAllTimersAsync();

    expect(harness.result.hasLoadedSettings.value).toBe(true);
    expect(harness.wrapper.text()).toContain('theme:retro');
  });

  it('applies controller settings with type-aware parsing and ignores unknown keys', async () => {
    const harness = mountSyncedSettings({
      models: {
        boolFalse: ref(true),
        boolTrue: ref(false),
        config: ref({ city: 'Old city' }),
        invalidJson: ref({ fallback: true }),
        list: ref('not-list-yet'),
        numberInvalid: ref(7),
        numberValid: ref(1),
        theme: ref('pixelrunner')
      }
    });
    const queryOptions = getQueryOptions();

    queryOptions.onSuccess?.([
      { key: 'boolFalse', value: 'false' },
      { key: 'boolTrue', value: 'true' },
      { key: 'config', value: '{"city":"Amsterdam"}' },
      { key: 'invalidJson', value: '{"city":' },
      { key: 'list', value: '["a","b"]' },
      { key: 'numberInvalid', value: 'NaN' },
      { key: 'numberValid', value: '12.5' },
      { key: 'theme', value: 'retro' },
      { key: 'unknown', value: 'ignored' }
    ]);

    expect(harness.result.isApplyingControllerSettings.value).toBe(true);
    expect(harness.result.hasLoadedSettings.value).toBe(true);
    expect(getModel(harness.models, 'boolFalse').value).toBe(false);
    expect(getModel(harness.models, 'boolTrue').value).toBe(true);
    expect(getModel(harness.models, 'config').value).toEqual({ city: 'Amsterdam' });
    expect(getModel(harness.models, 'invalidJson').value).toEqual({ fallback: true });
    expect(getModel(harness.models, 'list').value).toEqual(['a', 'b']);
    expect(getModel(harness.models, 'numberInvalid').value).toBe(7);
    expect(getModel(harness.models, 'numberValid').value).toBe(12.5);
    expect(getModel(harness.models, 'theme').value).toBe('retro');

    await flushPromises();

    expect(harness.result.isApplyingControllerSettings.value).toBe(false);
    expect(harness.settings?.set).not.toHaveBeenCalled();
  });

  it('debounces model saves, replaces pending timers and serializes the latest value', async () => {
    vi.useFakeTimers();
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const harness = mountSyncedSettings({ saveDebounceMs: 25 });
    getQueryOptions().onSuccess?.([{ key: 'theme', value: 'pixelrunner' }]);
    await flushPromises();

    getModel(harness.models, 'theme').value = 'first';
    await flushPromises();
    getModel(harness.models, 'theme').value = { palette: 'retro' };
    await flushPromises();

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(24);
    expect(harness.settings?.set).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(harness.settings?.set).toHaveBeenCalledExactlyOnceWith('theme', '{"palette":"retro"}');
    expect(consoleLog).toHaveBeenCalledWith('[SettingsPage] Saved device setting:', 'theme');
  });

  it('logs save failures and removes completed timers', async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const settings = createSettingsApi();
    const saveError = new Error('save failed');
    settings.set.mockRejectedValue(saveError);
    const harness = mountSyncedSettings({ saveDebounceMs: 10, settings });
    getQueryOptions().onSuccess?.([{ key: 'theme', value: 'pixelrunner' }]);
    await flushPromises();

    getModel(harness.models, 'theme').value = 'retro';
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10);

    expect(settings.set).toHaveBeenCalledWith('theme', 'retro');
    expect(consoleError).toHaveBeenCalledWith(
      '[SettingsPage] Failed to save device setting:',
      'theme',
      saveError
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears pending saves and resets loaded state when the controller disconnects', async () => {
    vi.useFakeTimers();
    const harness = mountSyncedSettings({ saveDebounceMs: 50 });
    getQueryOptions().onSuccess?.([{ key: 'theme', value: 'pixelrunner' }]);
    await flushPromises();

    getModel(harness.models, 'theme').value = 'retro';
    await flushPromises();
    expect(vi.getTimerCount()).toBe(1);

    harness.isConnectedSource.value = false;
    await flushPromises();
    await vi.runAllTimersAsync();

    expect(harness.result.hasLoadedSettings.value).toBe(false);
    expect(harness.settings?.set).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not save before settings load, while applying controller values, or while disconnected', async () => {
    vi.useFakeTimers();
    const harness = mountSyncedSettings({ isConnected: false, saveDebounceMs: 10 });

    getModel(harness.models, 'theme').value = 'before-load';
    await flushPromises();
    await vi.runAllTimersAsync();
    expect(harness.settings?.set).not.toHaveBeenCalled();

    getQueryOptions().onSuccess?.([{ key: 'theme', value: 'from-controller' }]);
    getModel(harness.models, 'theme').value = 'while-applying';
    await flushPromises();
    await vi.runAllTimersAsync();
    expect(harness.settings?.set).not.toHaveBeenCalled();

    harness.isConnectedSource.value = true;
    await flushPromises();
    getModel(harness.models, 'theme').value = 'after-connected';
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10);

    expect(harness.settings?.set).toHaveBeenCalledWith('theme', 'after-connected');
  });

  it('clears pending timers through the public helper and on component unmount', async () => {
    vi.useFakeTimers();
    const harness = mountSyncedSettings({ saveDebounceMs: 50 });
    getQueryOptions().onSuccess?.([{ key: 'theme', value: 'pixelrunner' }]);
    await flushPromises();

    getModel(harness.models, 'theme').value = 'retro';
    await flushPromises();
    expect(vi.getTimerCount()).toBe(1);

    harness.result.clearPendingSettingTimers();
    await vi.runAllTimersAsync();
    expect(harness.settings?.set).not.toHaveBeenCalled();

    getModel(harness.models, 'theme').value = 'midnight';
    await flushPromises();
    expect(vi.getTimerCount()).toBe(1);

    harness.wrapper.unmount();
    await vi.runAllTimersAsync();

    expect(harness.settings?.set).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

function mountSyncedSettings(
  options: {
    isConnected?: boolean;
    models?: Record<string, Ref<unknown>>;
    retryDelayMs?: number;
    saveDebounceMs?: number;
    settings?: SettingsApiMock | null;
  } = {}
) {
  resetSyncedSettingsMocks();
  const models = options.models ?? {
    theme: ref('pixelrunner')
  };
  const settings = options.settings === undefined ? createSettingsApi() : options.settings;
  const isConnectedSource = ref(options.isConnected ?? true);
  const resultHolder: { current?: SyncedResult } = {};

  const Harness = defineComponent({
    setup() {
      resultHolder.current = useSyncedControllerSettings({
        bindings: Object.entries(models).map(([key, model]) => ({ key, model })),
        isConnected: computed(() => isConnectedSource.value),
        lastError: ref(null),
        retryDelayMs: options.retryDelayMs,
        saveDebounceMs: options.saveDebounceMs,
        settings: settings as SettingsAPIInstance | null,
        state: ref('connected')
      });

      return () =>
        Object.entries(models)
          .map(([key, model]) => `${key}:${String(model.value)}`)
          .join('|');
    }
  });

  const wrapper = mount(Harness);

  const result = resultHolder.current;

  if (!result) {
    throw new Error('Synced settings composable did not initialize');
  }

  return {
    isConnectedSource,
    models,
    result,
    settings,
    wrapper: wrapper as VueWrapper
  };
}

function resetSyncedSettingsMocks(): void {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  syncedSettingsMock.queryOptions = [];
  syncedSettingsMock.queryReturn = {
    error: ref(''),
    hasAttempted: ref(false),
    isLoading: ref(false),
    isWaitingForPeer: ref(false),
    reload: vi.fn()
  };
}

type SettingsApiMock = {
  getAll: ReturnType<typeof vi.fn<() => Promise<SettingRecord[]>>>;
  set: ReturnType<typeof vi.fn<(key: string, value: string) => Promise<void>>>;
};

function createSettingsApi(): SettingsApiMock {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue(undefined)
  };
}

function getQueryOptions(): QueryOptions {
  const queryOptions = syncedSettingsMock.queryOptions.at(-1);

  if (!queryOptions) {
    throw new Error('Controller query options were not registered');
  }

  return queryOptions;
}

function getModel(models: Record<string, Ref<unknown>>, key: string): Ref<unknown> {
  const model = models[key];

  if (!model) {
    throw new Error(`Missing model: ${key}`);
  }

  return model;
}
