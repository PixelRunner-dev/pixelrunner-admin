import { nextTick, ref, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AccessWarning from '@/components/AccessWarning.vue';
import CallToAction from '@/components/CallToAction.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';
import {
  EXPERIMENTAL_FEATURES_SETTING_KEY,
  FEATURE_TOGGLE_SETTING_PREFIX,
  type FeatureToggleKey
} from '@/constants.ts';

interface FeatureToggleData {
  settingsByKey: Map<string, string>;
  controllerVersion: string | null;
}

interface FeatureToggleQueryOptions {
  canLoad: () => boolean;
  skipContext: () => {
    hasSettingsApi: boolean;
    hasDeviceApi: boolean;
    invalidFeatureKeys: string[];
  };
  load: () => Promise<FeatureToggleData>;
}

const featureToggleMock = vi.hoisted(() => ({
  data: undefined as FeatureToggleData | undefined,
  isConnected: true,
  state: 'connected',
  lastError: null as Error | null,
  hasDeviceApi: true,
  hasSettingsApi: true,
  settingRecords: [] as Array<{ key: string; value: string }>,
  status: { versions: { controller: '1.0.0' } } as unknown,
  queryOptions: undefined as FeatureToggleQueryOptions | undefined
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    device: featureToggleMock.hasDeviceApi
      ? {
          status: vi.fn(async () => featureToggleMock.status)
        }
      : undefined,
    isConnected: ref(featureToggleMock.isConnected),
    lastError: ref(featureToggleMock.lastError),
    settings: featureToggleMock.hasSettingsApi
      ? {
          getAll: vi.fn(async () => featureToggleMock.settingRecords)
        }
      : undefined,
    state: ref(featureToggleMock.state)
  })
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn((options: FeatureToggleQueryOptions) => {
    featureToggleMock.queryOptions = options;

    return {
      data: ref(featureToggleMock.data) as Ref<FeatureToggleData | undefined>,
      isLoading: ref(false),
      error: ref(null),
      hasAttempted: ref(Boolean(featureToggleMock.data)),
      isWaitingForPeer: ref(false),
      reload: vi.fn(),
      clearRetryTimer: vi.fn()
    };
  })
}));

const featureSettingKey = (key: FeatureToggleKey) => `${FEATURE_TOGGLE_SETTING_PREFIX}${key}`;

const createFeatureToggleData = (
  settings: Record<string, string>,
  controllerVersion = '1.0.0'
): FeatureToggleData => ({
  settingsByKey: new Map(Object.entries(settings)),
  controllerVersion
});

beforeEach(() => {
  document.body.innerHTML = '';
  featureToggleMock.data = undefined;
  featureToggleMock.isConnected = true;
  featureToggleMock.state = 'connected';
  featureToggleMock.lastError = null;
  featureToggleMock.hasDeviceApi = true;
  featureToggleMock.hasSettingsApi = true;
  featureToggleMock.settingRecords = [];
  featureToggleMock.status = { versions: { controller: '1.0.0' } };
  featureToggleMock.queryOptions = undefined;
});

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as typeof window & { $t?: (key: string) => string }).$t;
  vi.restoreAllMocks();
});

describe('AccessWarning', () => {
  it('renders translated access warning text via the i18next-vue global translator', async () => {
    mount(AccessWarning, {
      attachTo: document.body,
      global: {
        mocks: {
          $t: (key: string) => `translated:${key}`
        }
      }
    });

    await nextTick();

    expect(document.body.textContent).toContain('translated:accessWarningComponent.title');
    expect(document.body.textContent).toContain('translated:accessWarningComponent.message');
    expect(document.body.textContent).toContain('translated:accessWarningComponent.instruction');
  });
});

describe('CallToAction', () => {
  it('renders default classes, slot content, and forwarded attributes', () => {
    const wrapper = mount(CallToAction, {
      attrs: {
        type: 'button',
        disabled: true,
        'aria-label': 'Install applet'
      },
      slots: {
        default: 'Install'
      }
    });

    expect(wrapper.text()).toBe('Install');
    expect(wrapper.classes()).toContain('component--call-to-action');
    expect(wrapper.classes()).toContain('call-to-action--variant-secondary');
    expect(wrapper.classes()).toContain('call-to-action--size-default');
    expect(wrapper.classes()).not.toContain('is-loading');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-label')).toBe('Install applet');
  });

  it('applies variant, size, loading state, and emits native clicks', async () => {
    const onClick = vi.fn();
    const wrapper = mount(CallToAction, {
      props: {
        variant: 'primary',
        size: 'large',
        loading: true
      },
      attrs: {
        onClick
      },
      slots: {
        default: 'Save'
      }
    });

    await wrapper.trigger('click');

    expect(wrapper.classes()).toContain('call-to-action--variant-primary');
    expect(wrapper.classes()).toContain('call-to-action--size-large');
    expect(wrapper.classes()).toContain('is-loading');
    expect(onClick).toHaveBeenCalledOnce();
    expect(wrapper.attributes('onClick')).toBeUndefined();
  });
});

describe('FeatureToggle', () => {
  it('does not render before controller feature state is loaded', () => {
    const wrapper = mount(FeatureToggle, {
      props: {
        features: 'debug'
      },
      slots: {
        default: '<span>Debug tools</span>'
      }
    });

    expect(wrapper.text()).toBe('');
  });

  it('renders when experimental features and the requested feature are enabled', () => {
    featureToggleMock.data = createFeatureToggleData({
      [EXPERIMENTAL_FEATURES_SETTING_KEY]: 'true',
      [featureSettingKey('debug')]: 'true'
    });

    const wrapper = mount(FeatureToggle, {
      props: {
        features: 'debug'
      },
      slots: {
        default: '<span>Debug tools</span>'
      }
    });

    expect(wrapper.text()).toBe('Debug tools');
  });

  it('requires every requested feature to be enabled and supported', () => {
    featureToggleMock.data = createFeatureToggleData({
      [EXPERIMENTAL_FEATURES_SETTING_KEY]: 'true',
      [featureSettingKey('debug')]: 'true',
      [featureSettingKey('search')]: 'false'
    });

    const wrapper = mount(FeatureToggle, {
      props: {
        features: ['debug', 'search']
      },
      slots: {
        default: '<span>Search tools</span>'
      }
    });

    expect(wrapper.text()).toBe('');
  });

  it('does not render when experimental features are disabled or controller version is unsupported', () => {
    featureToggleMock.data = createFeatureToggleData(
      {
        [EXPERIMENTAL_FEATURES_SETTING_KEY]: 'true',
        [featureSettingKey('debug')]: 'true'
      },
      '0.0.0'
    );

    const unsupportedVersion = mount(FeatureToggle, {
      props: {
        features: 'debug'
      },
      slots: {
        default: '<span>Debug tools</span>'
      }
    });

    featureToggleMock.data = createFeatureToggleData({
      [EXPERIMENTAL_FEATURES_SETTING_KEY]: 'false',
      [featureSettingKey('debug')]: 'true'
    });

    const disabledExperimental = mount(FeatureToggle, {
      props: {
        features: 'debug'
      },
      slots: {
        default: '<span>Debug tools</span>'
      }
    });

    expect(unsupportedVersion.text()).toBe('');
    expect(disabledExperimental.text()).toBe('');
  });

  it('logs invalid feature keys and suppresses slot rendering', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    featureToggleMock.data = createFeatureToggleData({
      [EXPERIMENTAL_FEATURES_SETTING_KEY]: 'true',
      [featureSettingKey('debug')]: 'true'
    });

    const wrapper = mount(FeatureToggle, {
      props: {
        features: 'missing-feature' as FeatureToggleKey
      },
      slots: {
        default: '<span>Missing tools</span>'
      }
    });

    await nextTick();

    expect(wrapper.text()).toBe('');
    expect(consoleError).toHaveBeenCalledWith('[FeatureToggle] Unknown feature key(s):', [
      'missing-feature'
    ]);
  });

  it('loads feature settings through the controller query options', async () => {
    featureToggleMock.settingRecords = [
      { key: EXPERIMENTAL_FEATURES_SETTING_KEY, value: 'true' },
      { key: featureSettingKey('debug'), value: 'true' }
    ];
    featureToggleMock.status = { result: { versions: { controller: '1.2.3' } } };

    mount(FeatureToggle, {
      props: {
        features: 'debug'
      }
    });

    expect(featureToggleMock.queryOptions?.canLoad()).toBe(true);
    expect(featureToggleMock.queryOptions?.skipContext()).toEqual({
      hasSettingsApi: true,
      hasDeviceApi: true,
      invalidFeatureKeys: []
    });
    await expect(featureToggleMock.queryOptions?.load()).resolves.toEqual({
      settingsByKey: new Map([
        [EXPERIMENTAL_FEATURES_SETTING_KEY, 'true'],
        [featureSettingKey('debug'), 'true']
      ]),
      controllerVersion: '1.2.3'
    });
  });

  it('reports skipped query context and empty load data when controller APIs are missing', async () => {
    featureToggleMock.hasDeviceApi = false;
    featureToggleMock.hasSettingsApi = false;

    mount(FeatureToggle, {
      props: {
        features: 'debug'
      }
    });

    expect(featureToggleMock.queryOptions?.canLoad()).toBe(false);
    expect(featureToggleMock.queryOptions?.skipContext()).toEqual({
      hasSettingsApi: false,
      hasDeviceApi: false,
      invalidFeatureKeys: []
    });
    await expect(featureToggleMock.queryOptions?.load()).resolves.toEqual({
      settingsByKey: new Map(),
      controllerVersion: null
    });
  });
});
