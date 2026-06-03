import { flushPromises, mount } from '@vue/test-utils';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import AppletConfig from '@/components/Applet/AppletConfig.vue';

import type { IAppletConfigurations, IFullApplet, UUID } from 'pixelrunner-shared';

const appletApiMock = vi.hoisted(() => ({
  isConnected: { __v_isRef: true, value: true },
  applets: {
    getSchema: vi.fn(),
    install: vi.fn(),
    remove: vi.fn(),
    saveConfig: vi.fn(),
    updateHidden: vi.fn(),
    updatePinned: vi.fn()
  },
  settings: {
    get: vi.fn()
  },
  notifications: {
    addNotification: vi.fn()
  },
  router: {
    replace: vi.fn()
  }
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    applets: appletApiMock.applets,
    isConnected: appletApiMock.isConnected,
    settings: appletApiMock.settings
  })
}));

vi.mock('@/composables/useNotifications.ts', () => ({
  useNotifications: () => appletApiMock.notifications
}));

vi.mock('vue-router', () => ({
  useRouter: () => appletApiMock.router
}));

function installWorkerMock() {
  globalThis.Worker = class MockWorker {
    onerror: ((event: ErrorEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    postMessage = vi.fn();
    terminate = vi.fn();
  } as unknown as typeof Worker;
}

describe('AppletConfig', () => {
  beforeAll(async () => {
    await i18next.init({
      lng: 'cimode',
      resources: {}
    });
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    installWorkerMock();
    appletApiMock.isConnected.value = true;
    appletApiMock.applets.getSchema.mockReset();
    appletApiMock.applets.install.mockReset();
    appletApiMock.applets.remove.mockReset();
    appletApiMock.applets.saveConfig.mockReset();
    appletApiMock.applets.updateHidden.mockReset();
    appletApiMock.applets.updatePinned.mockReset();
    appletApiMock.settings.get.mockReset();
    appletApiMock.notifications.addNotification.mockReset();
    appletApiMock.router.replace.mockReset();
    appletApiMock.settings.get.mockResolvedValue('');
    appletApiMock.applets.getSchema.mockResolvedValue({ schema: [] });
    appletApiMock.applets.install.mockResolvedValue(undefined);
    appletApiMock.applets.remove.mockResolvedValue(undefined);
    appletApiMock.applets.saveConfig.mockResolvedValue(undefined);
    appletApiMock.applets.updateHidden.mockImplementation(async (_uuid: UUID, isHidden: boolean) =>
      makeApplet({ installed: true, isHidden })
    );
    appletApiMock.applets.updatePinned.mockImplementation(async (_uuid: UUID, isPinned: boolean) =>
      makeApplet({ installed: true, isPinned })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    installWorkerMock();
  });

  it('does not load schema while disconnected and disables submit', async () => {
    appletApiMock.isConnected.value = false;

    const wrapper = mountConfig(makeApplet({ installed: false }));
    await flushPromises();

    expect(appletApiMock.applets.getSchema).not.toHaveBeenCalled();
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('loads schema, filters unsupported items, normalizes defaults, and submits install payload', async () => {
    appletApiMock.settings.get.mockResolvedValue(JSON.stringify({ city: 'Amsterdam' }));
    appletApiMock.applets.getSchema.mockResolvedValue(
      JSON.stringify({
        version: '2',
        schema: [
          {
            id: 'enabled',
            type: 'onoff',
            name: 'Enabled',
            default: 'true',
            desc: 'Toggle applet'
          },
          {
            id: 'accent',
            type: 'color',
            name: 'Accent',
            palette: ['#ff0000'],
            description: 'Accent color'
          },
          {
            id: 'city',
            type: 'location',
            name: 'City',
            desc: 'City location'
          },
          {
            id: 'ignored',
            type: 'unknown'
          }
        ]
      })
    );
    const wrapper = mountConfig(makeApplet({ installed: false }));
    await flushPromises();

    expect(appletApiMock.settings.get).toHaveBeenCalledWith('location');
    expect(appletApiMock.applets.getSchema).toHaveBeenCalledWith('weather');
    expect(wrapper.findAll('[data-testid="form-field"]')).toHaveLength(3);

    await wrapper.get('form').trigger('submit');

    expect(appletApiMock.applets.install).toHaveBeenCalledWith('weather', {
      appId: 'weather',
      config: {
        enabled: true,
        accent: '#ff0000',
        city: { city: 'Amsterdam' }
      }
    });
    expect(appletApiMock.router.replace).toHaveBeenCalledWith('/applets');
  });

  it('loads edit mode from applied configuration and saves by installed uuid', async () => {
    appletApiMock.applets.getSchema.mockResolvedValue({
      schema: [
        {
          id: 'label',
          type: 'text',
          name: 'Label',
          default: 'Default'
        },
        {
          id: 'enabled',
          type: 'onoff',
          name: 'Enabled'
        }
      ]
    });
    const wrapper = mountConfig(
      makeApplet({
        installed: true,
        config: {
          label: 'Existing',
          enabled: 'true'
        }
      })
    );
    await flushPromises();

    expect(wrapper.findAll('[data-testid="form-field"]')).toHaveLength(2);

    await wrapper.get('form').trigger('submit');

    expect(appletApiMock.applets.saveConfig).toHaveBeenCalledWith('weather-uuid', {
      appId: 'weather',
      config: {
        label: 'Existing',
        enabled: true
      }
    });
    expect(appletApiMock.applets.install).not.toHaveBeenCalled();
  });

  it('shows schema load errors and sends an error notification', async () => {
    appletApiMock.applets.getSchema.mockRejectedValue(new Error('schema unavailable'));

    const wrapper = mountConfig(makeApplet({ installed: false }));
    await flushPromises();

    expect(wrapper.text()).toContain('Configuration schema unavailable.');
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'schema unavailable',
      hasCloseButton: true
    });
  });

  it('does not submit invalid forms and reports install failures', async () => {
    appletApiMock.applets.getSchema.mockResolvedValue({
      schema: [{ id: 'label', type: 'text', name: 'Label', default: 'Default' }]
    });
    appletApiMock.applets.install.mockRejectedValue(new Error('install failed'));
    const wrapper = mountConfig(makeApplet({ installed: false }), { reportValidity: false });
    await flushPromises();

    await wrapper.get('form').trigger('submit');
    expect(appletApiMock.applets.install).not.toHaveBeenCalled();

    setReportValidity(wrapper, true);
    await wrapper.get('form').trigger('submit');

    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'install failed',
      hasCloseButton: true
    });
    expect(appletApiMock.router.replace).not.toHaveBeenCalled();
  });

  it('removes installed applets and reports success or failure', async () => {
    const wrapper = mountConfig(makeApplet({ installed: true }));
    await flushPromises();

    await wrapper.get('button[type="button"]').trigger('click');
    await flushPromises();

    expect(appletApiMock.applets.remove).toHaveBeenCalledWith('weather-uuid');
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        hasCloseButton: true
      })
    );
    expect(appletApiMock.router.replace).toHaveBeenCalledWith('/applets');

    appletApiMock.applets.remove.mockRejectedValueOnce(new Error('remove failed'));
    appletApiMock.notifications.addNotification.mockClear();
    appletApiMock.router.replace.mockClear();

    await wrapper.get('button[type="button"]').trigger('click');
    await flushPromises();

    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'remove failed',
      hasCloseButton: true
    });
    expect(appletApiMock.router.replace).not.toHaveBeenCalled();
  });

  it('shows installed-only hidden and pinned toggles', async () => {
    const libraryWrapper = mountConfig(makeApplet({ installed: false }));
    await flushPromises();

    expect(libraryWrapper.findAll('input[type="checkbox"]')).toHaveLength(0);

    const installedWrapper = mountConfig(
      makeApplet({ installed: true, isHidden: true, isPinned: true })
    );
    await flushPromises();

    expect(getToggleInput(installedWrapper, 0).checked).toBe(true);
    expect(getToggleInput(installedWrapper, 1).checked).toBe(true);
  });

  it('persists hidden toggle changes with uuid and keeps success state', async () => {
    const wrapper = mountConfig(makeApplet({ installed: true, isHidden: false }));
    await flushPromises();

    await getToggle(wrapper, 0).setValue(true);
    await flushPromises();

    expect(appletApiMock.applets.updateHidden).toHaveBeenCalledWith('weather-uuid', true);
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        hasCloseButton: true
      })
    );
  });

  it('rolls back hidden toggle changes on failure', async () => {
    appletApiMock.applets.updateHidden.mockRejectedValueOnce(new Error('visibility failed'));
    const wrapper = mountConfig(makeApplet({ installed: true, isHidden: false }));
    await flushPromises();

    await getToggle(wrapper, 0).setValue(true);
    await flushPromises();

    expect(getToggleInput(wrapper, 0).checked).toBe(false);
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'visibility failed',
      hasCloseButton: true
    });
  });

  it('clears isPinned when isHidden is toggled on and restores it if the update fails', async () => {
    const wrapper = mountConfig(makeApplet({ installed: true, isHidden: false, isPinned: true }));
    await flushPromises();

    expect(getToggleInput(wrapper, 1).checked).toBe(true);

    await getToggle(wrapper, 0).setValue(true);
    await flushPromises();

    expect(getToggleInput(wrapper, 1).checked).toBe(false);

    appletApiMock.applets.updateHidden.mockRejectedValueOnce(new Error('visibility failed'));
    appletApiMock.notifications.addNotification.mockClear();
    const wrapper2 = mountConfig(makeApplet({ installed: true, isHidden: false, isPinned: true }));
    await flushPromises();

    await getToggle(wrapper2, 0).setValue(true);
    await flushPromises();

    expect(getToggleInput(wrapper2, 1).checked).toBe(true);
  });

  it('persists pinned toggle changes with uuid and rolls back on failure', async () => {
    const wrapper = mountConfig(makeApplet({ installed: true, isPinned: false }));
    await flushPromises();

    await getToggle(wrapper, 1).setValue(true);
    await flushPromises();

    expect(appletApiMock.applets.updatePinned).toHaveBeenCalledWith('weather-uuid', true);
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        hasCloseButton: true
      })
    );

    appletApiMock.applets.updatePinned.mockRejectedValueOnce(new Error('pin failed'));
    appletApiMock.notifications.addNotification.mockClear();

    await getToggle(wrapper, 1).setValue(false);
    await flushPromises();

    expect(getToggleInput(wrapper, 1).checked).toBe(true);
    expect(appletApiMock.notifications.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'pin failed',
      hasCloseButton: true
    });
  });
});

type MountOptions = {
  reportValidity?: boolean;
};

function mountConfig(applet: IFullApplet, options: MountOptions = {}) {
  const wrapper = mount(AppletConfig, {
    props: { applet },
    global: {
      plugins: [[I18NextVue, { i18next }]],
      stubs: {
        DButton: {
          props: ['disabled', 'type'],
          template:
            '<button :data-testid="type === `submit` ? `submit` : `remove`" :disabled="disabled" :type="type || `button`"><slot /></button>'
        },
        DDivider: { template: '<hr />' },
        DFlex: { template: '<div><slot /></div>' },
        DToggle: {
          props: ['disabled', 'modelValue'],
          emits: ['update:modelValue'],
          template:
            '<input type="checkbox" :aria-label="$attrs[`aria-label`]" :checked="modelValue" :disabled="disabled" @change="$emit(`update:modelValue`, $event.target.checked)" />'
        },
        FeatureToggle: { template: '<section data-testid="feature-toggle"><slot /></section>' },
        FieldSchedule: { template: '<div data-testid="schedule-field" />' },
        FormField: {
          props: ['description', 'id', 'label'],
          template:
            '<label data-testid="form-field" :data-field-id="id"><span>{{ label }}</span><slot /></label>'
        }
      }
    }
  });
  setReportValidity(wrapper, options.reportValidity ?? true);
  return wrapper;
}

function getToggle(wrapper: ReturnType<typeof mountConfig>, index: number) {
  const toggle = wrapper.findAll('input[type="checkbox"]')[index];

  if (!toggle) {
    throw new Error(`Missing toggle at index ${index}`);
  }

  return toggle;
}

function getToggleInput(wrapper: ReturnType<typeof mountConfig>, index: number) {
  return getToggle(wrapper, index).element as HTMLInputElement;
}

function setReportValidity(wrapper: ReturnType<typeof mount>, result: boolean) {
  const form = wrapper.get('form').element as HTMLFormElement;
  form.reportValidity = vi.fn(() => result);
}

function makeApplet(options: {
  config?: IAppletConfigurations['config'];
  isHidden?: boolean;
  isPinned?: boolean;
  installed: boolean;
}): IFullApplet {
  const applet: IFullApplet = {
    packageName: 'weather',
    fileName: 'weather.star',
    details: {
      name: 'Weather',
      summary: 'Forecast',
      desc: 'Weather forecast',
      author: 'Pixelrunner'
    },
    defaultImage: {
      src: '/weather.webp',
      alt: 'Weather preview',
      dateCreated: new Date('2026-01-01T00:00:00.000Z')
    },
    categories: [],
    isInstalled: options.installed
  };

  if (options.installed) {
    applet.installationDetails = {
      uuid: 'weather-uuid' as UUID,
      image: {
        src: '/weather-installed.webp',
        alt: 'Weather installed preview',
        dateCreated: new Date('2026-01-02T00:00:00.000Z')
      },
      appliedConfigurations: {
        appId: 'weather',
        config: options.config ?? {}
      },
      isHidden: options.isHidden ?? false,
      isPinned: options.isPinned ?? false
    };
  }

  return applet;
}
