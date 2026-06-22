import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appletConfigContextKey,
  type IAppletConfigContext
} from '@/utils/applet-config-context.ts';
import FieldGenerated from '@/components/Form/AppletFields/FieldGenerated.vue';

const apiMock = vi.hoisted(() => ({
  applets: {
    callSchemaHandler: vi.fn()
  }
}));

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({ applets: apiMock.applets })
}));

function makeContext(initial: Record<string, unknown> = {}): IAppletConfigContext {
  const values = ref<Record<string, NonNullable<unknown>>>({
    ...(initial as Record<string, NonNullable<unknown>>)
  });
  return {
    packageName: 'weather',
    values,
    setValue: (id, value) => {
      values.value = { ...values.value, [id]: value };
    },
    ensureDefault: (id, value) => {
      if (value !== undefined && values.value[id] === undefined) {
        values.value = { ...values.value, [id]: value };
      }
    }
  };
}

function mountField(
  props: { id: string; source?: string; handler?: string },
  ctx: IAppletConfigContext | null = makeContext({ country: 'NL' })
) {
  return mount(FieldGenerated, {
    props,
    global: {
      provide: ctx ? { [appletConfigContextKey as symbol]: ctx } : {},
      mocks: { $t: (key: string) => key },
      stubs: {
        FormField: { template: '<div class="form-field"><slot /></div>' },
        DText: { template: '<span><slot /></span>' }
      }
    }
  });
}

describe('FieldGenerated', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMock.applets.callSchemaHandler.mockReset();
    apiMock.applets.callSchemaHandler.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the handler on mount with the current source value (after debounce)', async () => {
    mountField({ id: 'city', source: 'country', handler: 'list_cities' });

    expect(apiMock.applets.callSchemaHandler).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(250);

    expect(apiMock.applets.callSchemaHandler).toHaveBeenCalledExactlyOnceWith(
      'weather',
      'list_cities',
      'NL'
    );
  });

  it('debounces rapid source-value changes into a single call with the latest value', async () => {
    const ctx = makeContext({ country: 'NL' });
    mountField({ id: 'city', source: 'country', handler: 'list_cities' }, ctx);

    await vi.advanceTimersByTimeAsync(250);
    expect(apiMock.applets.callSchemaHandler).toHaveBeenCalledTimes(1);

    ctx.setValue('country', 'DE');
    ctx.setValue('country', 'FR');
    ctx.setValue('country', 'ES');

    await vi.advanceTimersByTimeAsync(250);
    expect(apiMock.applets.callSchemaHandler).toHaveBeenCalledTimes(2);
    expect(apiMock.applets.callSchemaHandler).toHaveBeenLastCalledWith('weather', 'list_cities', 'ES');
  });

  it('shows an error message when the handler rejects and keeps the form responsive', async () => {
    apiMock.applets.callSchemaHandler.mockRejectedValueOnce(new Error('boom'));
    const wrapper = mountField({ id: 'city', source: 'country', handler: 'list_cities' });

    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    expect(wrapper.find('[data-testid="field-generated-error"]').exists()).toBe(true);
  });

  it('seeds sub-field defaults into the parent config dict without overwriting user values', async () => {
    const ctx = makeContext({ country: 'NL', existing: 'kept' });
    apiMock.applets.callSchemaHandler.mockResolvedValueOnce([
      { id: 'existing', type: 'text', name: 'Existing', desc: '', icon: '', default: 'fromHandler' },
      { id: 'fresh', type: 'text', name: 'Fresh', desc: '', icon: '', default: 'fromHandler' }
    ]);

    mountField({ id: 'city', source: 'country', handler: 'list_cities' }, ctx);
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    expect(ctx.values.value.existing).toBe('kept');
    expect(ctx.values.value.fresh).toBe('fromHandler');
  });

  it('renders a misconfigured notice when no context is provided', async () => {
    const wrapper = mountField(
      { id: 'city', source: 'country', handler: 'list_cities' },
      null
    );
    await flushPromises();

    expect(wrapper.text()).toContain('applet.config.generated.misconfigured');
    expect(apiMock.applets.callSchemaHandler).not.toHaveBeenCalled();
  });

  it('does not call the handler when handler or source props are missing', async () => {
    mountField({ id: 'city', source: undefined, handler: 'list_cities' });
    mountField({ id: 'city', source: 'country', handler: undefined });

    await vi.advanceTimersByTimeAsync(250);
    expect(apiMock.applets.callSchemaHandler).not.toHaveBeenCalled();
  });
});
