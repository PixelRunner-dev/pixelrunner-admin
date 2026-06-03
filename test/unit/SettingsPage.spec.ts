import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/pages/SettingsPage.vue';
import { CookieStore } from '@/utils/CookieStore.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useSyncedControllerSettings } from '@/composables/useSyncedControllerSettings.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import type { WifiScanNetwork, WifiStatus } from '@/ws/api/settings.ts';

const notificationsMock = vi.hoisted(() => ({
  addNotification: vi.fn(),
  removeNotification: vi.fn(),
  setNotification: vi.fn(),
  notifications: { __v_isRef: true, value: [] as unknown[] }
}));

const settingsPageMock = vi.hoisted(() => ({
  route: {
    name: 'settings',
    query: {} as Record<string, string>
  },
  device: {
    reboot: vi.fn(),
    shutdown: vi.fn(),
    status: vi.fn()
  },
  settings: {
    configureWifi: vi.fn(),
    getWifiStatus: vi.fn(),
    scanWifiNetworks: vi.fn(),
    set: vi.fn()
  },
  isConnected: { __v_isRef: true, value: true },
  lastError: { __v_isRef: true, value: null as Error | null },
  state: { __v_isRef: true, value: 'connected' }
}));

vi.mock('@/composables/useNotifications.ts', () => ({
  useNotifications: () => notificationsMock,
  provideNotifications: vi.fn(() => notificationsMock)
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    device: settingsPageMock.device,
    isConnected: settingsPageMock.isConnected,
    lastError: settingsPageMock.lastError,
    settings: settingsPageMock.settings,
    state: settingsPageMock.state
  })
}));

vi.mock('vue-router', () => ({
  useRoute: () => settingsPageMock.route
}));

vi.mock('@/composables/useSyncedControllerSettings.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/composables/useSyncedControllerSettings.ts')>()),
  useSyncedControllerSettings: vi.fn(() => ({
    hasLoadedSettings: { __v_isRef: true, value: true },
    isLoadingSettings: { __v_isRef: true, value: false },
    settingsError: { __v_isRef: true, value: '' }
  }))
}));

vi.mock('@/composables/useControllerQuery.ts', () => ({
  useControllerQuery: vi.fn(() => ({
    clearRetryTimer: vi.fn(),
    error: { __v_isRef: true, value: '' },
    hasAttempted: { __v_isRef: true, value: true },
    isLoading: { __v_isRef: true, value: false },
    isWaitingForPeer: { __v_isRef: true, value: false },
    reload: vi.fn()
  }))
}));

vi.mock('@/utils/generic.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/generic.ts')>()),
  vibrateDevice: vi.fn()
}));

const connectedStatus: WifiStatus = {
  activeConnection: 'Home',
  configured: true,
  interface: 'wlan0',
  mode: 'client',
  ssid: 'Home',
  security: 'wpa',
  ipMode: 'static',
  addresses: ['192.168.1.20/24'],
  gateway: '192.168.1.1',
  dnsServers: ['1.1.1.1', '8.8.8.8'],
  setupAccessPointSsid: 'Pixelrunner Setup',
  signal: 78
};

const scannedNetworks: WifiScanNetwork[] = [
  {
    bssid: '00:11:22:33:44:55',
    ssid: 'Cafe',
    security: 'WPA2',
    active: false,
    signal: 86
  },
  {
    bssid: '66:77:88:99:aa:bb',
    ssid: 'OpenNet',
    security: '--',
    active: false,
    signal: 40
  }
];

describe('SettingsPage', () => {
  beforeAll(async () => {
    await i18next.init({
      lng: 'cimode',
      resources: {}
    });
  });

  afterEach(() => {
    CookieStore.delete('theme');
    document.documentElement.removeAttribute('data-theme');
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('wires controller settings, feature status query, and initial WiFi loads', async () => {
    const wrapper = await mountSettingsPage();

    expect(useSyncedControllerSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        isConnected: expect.any(Object),
        lastError: settingsPageMock.lastError,
        settings: settingsPageMock.settings,
        state: settingsPageMock.state
      })
    );
    expect(vi.mocked(useSyncedControllerSettings).mock.calls[0]?.[0].bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'deviceName' }),
        expect.objectContaining({ key: 'brightness' }),
        expect.objectContaining({ key: 'experimentalFeatures' })
      ])
    );
    expect(useControllerQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'SettingsPage - feature toggles'
      })
    );
    expect(settingsPageMock.settings.getWifiStatus).toHaveBeenCalledOnce();
    expect(settingsPageMock.settings.scanWifiNetworks).toHaveBeenCalledOnce();
    expect((wrapper.get('#ssid').element as HTMLInputElement).value).toBe('Home');
    expect((wrapper.get('#ip').element as HTMLInputElement).value).toBe('192.168.1.20');
    expect((wrapper.get('#primaryDns').element as HTMLInputElement).value).toBe('1.1.1.1');
  });

  it('selects a scanned WiFi network and saves the configured payload', async () => {
    const configuredStatus: WifiStatus = {
      ...connectedStatus,
      ssid: 'Cafe',
      security: 'wpa',
      addresses: ['10.0.0.2/24'],
      dnsServers: []
    };
    settingsPageMock.settings.configureWifi.mockResolvedValueOnce(configuredStatus);
    const wrapper = await mountSettingsPage();

    await buttonByText(wrapper, 'Cafe').trigger('click');
    await wrapper.get('#password').setValue('secret-pass');
    await wifiApplyButton(wrapper).trigger('click');
    await flushPromises();

    expect(settingsPageMock.settings.configureWifi).toHaveBeenCalledWith({
      dhcp: 'static',
      dns: 'manual',
      gateway: '192.168.1.1',
      hiddenNetwork: false,
      ip: '192.168.1.20',
      password: 'secret-pass',
      primaryDns: '1.1.1.1',
      secondaryDns: '8.8.8.8',
      security: 'wpa',
      ssid: 'Cafe',
      subnet: '24'
    });
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect((wrapper.get('#ssid').element as HTMLInputElement).value).toBe('Cafe');
  });

  it('shows WiFi load and scan errors and allows manual retry', async () => {
    settingsPageMock.settings.getWifiStatus.mockRejectedValueOnce(new Error('status failed'));
    settingsPageMock.settings.scanWifiNetworks.mockRejectedValueOnce(new Error('scan failed'));

    const wrapper = await mountSettingsPage();

    expect(wrapper.text()).toContain('scan failed');

    settingsPageMock.settings.scanWifiNetworks.mockResolvedValueOnce(scannedNetworks);
    await wifiRefreshButton(wrapper).trigger('click');
    await flushPromises();

    expect(settingsPageMock.settings.scanWifiNetworks).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Cafe');
  });

  it('renders first-time setup mode without general settings', async () => {
    const wrapper = await mountSettingsPage({ firstTime: true });

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('#deviceName').exists()).toBe(false);
    expect(wrapper.find('#theme').exists()).toBe(false);
    expect(wrapper.find('#ssid').exists()).toBe(true);
  });

  it('filters device-name input and paste values', async () => {
    const wrapper = await mountSettingsPage();
    const deviceName = wrapper.get('#deviceName');
    const invalidBeforeInput = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: '!'
    });
    const validBeforeInput = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: '_'
    });

    deviceName.element.dispatchEvent(invalidBeforeInput);
    deviceName.element.dispatchEvent(validBeforeInput);

    expect(invalidBeforeInput.defaultPrevented).toBe(true);
    expect(validBeforeInput.defaultPrevented).toBe(false);

    await deviceName.trigger('paste', {
      clipboardData: {
        getData: () => 'bad name!'
      }
    });

    expect((deviceName.element as HTMLInputElement).value).toBe('badname!');
  });

  it('persists the selected theme and vibrates for brightness/touch feedback', async () => {
    const wrapper = await mountSettingsPage();

    await wrapper.get('#theme').setValue('dark');
    await wrapper.get('#brightness').setValue(50);
    await wifiRefreshButton(wrapper).trigger('touchstart');
    await wifiRefreshButton(wrapper).trigger('touchend');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(CookieStore.get('theme')).toBe('dark');
    expect(vibrateDevice).toHaveBeenCalledWith(15);
    expect(vibrateDevice).toHaveBeenCalledWith(4);
    expect(vibrateDevice).toHaveBeenCalledWith(1);
  });

  it('handles firmware and factory reset actions', async () => {
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const wrapper = await mountSettingsPage();

    await actionButton(wrapper, 'firmware-update').trigger('click');
    await actionButton(wrapper, 'factory-reset').trigger('click');
    await actionButton(wrapper, 'factory-reset').trigger('click');
    await flushPromises();

    expect(settingsPageMock.device.status).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledWith('reset device');
    expect(consoleLog).toHaveBeenCalledWith('reset device canceled');
  });

  it('reboot calls device.reboot() and shows translated notifications', async () => {
    const wrapper = await mountSettingsPage();

    await actionButton(wrapper, 'reboot').trigger('click');
    await flushPromises();

    expect(settingsPageMock.device.reboot).toHaveBeenCalledOnce();
    expect(notificationsMock.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info' })
    );
    expect(notificationsMock.removeNotification).toHaveBeenCalledWith(expect.any(String));
    expect(notificationsMock.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', timeoutToClose: 10000 })
    );
  });

  it('shutdown calls device.shutdown() and shows translated notifications', async () => {
    const wrapper = await mountSettingsPage();

    await actionButton(wrapper, 'shutdown').trigger('click');
    await flushPromises();

    expect(settingsPageMock.device.shutdown).toHaveBeenCalledOnce();
    expect(notificationsMock.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info' })
    );
    expect(notificationsMock.removeNotification).toHaveBeenCalledWith(expect.any(String));
    expect(notificationsMock.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', timeoutToClose: 10000 })
    );
  });

  it('shows error notification on reboot failure', async () => {
    settingsPageMock.device.reboot.mockRejectedValueOnce(new Error('reboot failed'));
    const wrapper = await mountSettingsPage();

    await actionButton(wrapper, 'reboot').trigger('click');
    await flushPromises();

    expect(notificationsMock.removeNotification).toHaveBeenCalledWith(expect.any(String));
    expect(notificationsMock.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'reboot failed',
      hasCloseButton: true
    });
  });

  it('shows error notification on shutdown failure', async () => {
    settingsPageMock.device.shutdown.mockRejectedValueOnce(new Error('shutdown failed'));
    const wrapper = await mountSettingsPage();

    await actionButton(wrapper, 'shutdown').trigger('click');
    await flushPromises();

    expect(notificationsMock.removeNotification).toHaveBeenCalledWith(expect.any(String));
    expect(notificationsMock.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'shutdown failed',
      hasCloseButton: true
    });
  });

  it('reboot button is disabled while pending and ignores duplicate clicks', async () => {
    let resolveReboot!: () => void;
    settingsPageMock.device.reboot.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveReboot = resolve;
      })
    );
    const wrapper = await mountSettingsPage();
    const rebootBtn = actionButton(wrapper, 'reboot');

    await rebootBtn.trigger('click');

    expect((rebootBtn.element as HTMLButtonElement).disabled).toBe(true);

    await rebootBtn.trigger('click');
    resolveReboot();
    await flushPromises();

    expect(settingsPageMock.device.reboot).toHaveBeenCalledOnce();
    expect((rebootBtn.element as HTMLButtonElement).disabled).toBe(false);
  });

  it('shutdown button is disabled while pending and ignores duplicate clicks', async () => {
    let resolveShutdown!: () => void;
    settingsPageMock.device.shutdown.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveShutdown = resolve;
      })
    );
    const wrapper = await mountSettingsPage();
    const shutdownBtn = actionButton(wrapper, 'shutdown');

    await shutdownBtn.trigger('click');

    expect((shutdownBtn.element as HTMLButtonElement).disabled).toBe(true);

    await shutdownBtn.trigger('click');
    resolveShutdown();
    await flushPromises();

    expect(settingsPageMock.device.shutdown).toHaveBeenCalledOnce();
    expect((shutdownBtn.element as HTMLButtonElement).disabled).toBe(false);
  });
});

async function mountSettingsPage(options: { firstTime?: boolean; connected?: boolean } = {}) {
  resetSettingsPageMocks(options);

  const wrapper = mount(SettingsPage, {
    global: {
      plugins: [[I18NextVue, { i18next }]],
      mocks: {
        $route: settingsPageMock.route
      },
      stubs: settingsPageStubs()
    }
  });

  await flushPromises();

  return wrapper;
}

function resetSettingsPageMocks(options: { firstTime?: boolean; connected?: boolean }): void {
  vi.clearAllMocks();
  settingsPageMock.route.name = 'settings';
  settingsPageMock.route.query = options.firstTime ? { 'first-time': '1' } : {};
  settingsPageMock.isConnected.value = options.connected ?? true;
  settingsPageMock.lastError.value = null;
  settingsPageMock.state.value = 'connected';
  settingsPageMock.device.reboot.mockResolvedValue(undefined);
  settingsPageMock.device.shutdown.mockResolvedValue(undefined);
  settingsPageMock.device.status.mockResolvedValue({ versions: { controller: '1.0.0' } });
  settingsPageMock.settings.configureWifi.mockResolvedValue(connectedStatus);
  settingsPageMock.settings.getWifiStatus.mockResolvedValue(connectedStatus);
  settingsPageMock.settings.scanWifiNetworks.mockResolvedValue(scannedNetworks);
  settingsPageMock.settings.set.mockResolvedValue(undefined);
}

function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(text));

  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }

  return button;
}

function wifiApplyButton(wrapper: VueWrapper) {
  return wrapper.get('[data-testid="wifi-apply"]');
}

function wifiRefreshButton(wrapper: VueWrapper) {
  return wrapper.get('[data-testid="wifi-refresh"]');
}

function actionButton(
  wrapper: VueWrapper,
  testId: 'factory-reset' | 'firmware-update' | 'reboot' | 'shutdown'
) {
  return wrapper.get(`[data-testid="${testId}"]`);
}

function settingsPageStubs() {
  return {
    DAlert: {
      props: ['error', 'info', 'success'],
      template: '<div :role="$attrs.role || `alert`" v-bind="$attrs"><slot /></div>'
    },
    DBadge: {
      template: '<span><slot /></span>'
    },
    DButton: {
      props: ['disabled', 'type'],
      emits: ['click', 'touchstart', 'touchend'],
      template: `
        <button
          v-bind="$attrs"
          :type="type || 'button'"
          :disabled="disabled"
          @click="$emit('click', $event)"
          @touchstart="$emit('touchstart', $event)"
          @touchend="$emit('touchend', $event)"
        >
          <slot />
        </button>
      `
    },
    DCheckbox: {
      props: ['id', 'modelValue', 'name', 'disabled'],
      emits: ['update:modelValue'],
      template: `
        <input
          :id="id"
          type="checkbox"
          :name="name"
          :checked="modelValue"
          :disabled="disabled"
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
      `
    },
    DCollapse: {
      template: '<section><slot /></section>'
    },
    DCollapseContent: {
      template: '<div><slot /></div>'
    },
    DCollapseTitle: {
      template: '<h3><slot /></h3>'
    },
    DFieldset: {
      props: ['disabled', 'legend'],
      template: '<fieldset :disabled="disabled"><legend>{{ legend }}</legend><slot /></fieldset>'
    },
    DFlex: {
      template: '<div><slot /></div>'
    },
    DFormControl: {
      template: '<div><slot /></div>'
    },
    DInput: {
      props: ['disabled', 'id', 'modelValue', 'name', 'placeholder', 'readonly', 'type'],
      emits: ['update:modelValue'],
      template: `
        <input
          v-bind="$attrs"
          :id="id"
          :name="name"
          :placeholder="placeholder"
          :readonly="readonly"
          :disabled="disabled"
          :type="type || 'text'"
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      `
    },
    DLabel: {
      template: '<label v-bind="$attrs"><slot /></label>'
    },
    DRange: {
      props: ['disabled', 'id', 'max', 'min', 'modelValue', 'name', 'step'],
      emits: ['update:modelValue'],
      template: `
        <input
          v-bind="$attrs"
          :id="id"
          type="range"
          :name="name"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          :value="modelValue"
          @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        />
      `
    },
    DText: {
      props: ['is'],
      template: '<component :is="is || `span`"><slot /></component>'
    },
    DToggle: {
      props: ['disabled', 'modelValue'],
      emits: ['update:modelValue'],
      template:
        '<button type="button" :disabled="disabled" @click="$emit(\'update:modelValue\', !modelValue)">toggle</button>'
    },
    DebugSection: {
      props: ['data'],
      template: '<pre data-testid="debug-section">{{ JSON.stringify(data) }}</pre>'
    },
    FeatureToggle: {
      template: '<div><slot /></div>'
    },
    LocationSearch: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<input id="location" :value="JSON.stringify(modelValue ?? {})" />'
    },
    SetLanguage: {
      template: '<div data-testid="set-language" />'
    },
    Transition: false
  };
}
