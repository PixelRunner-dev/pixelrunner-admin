import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appletConfigContextKey,
  type IAppletConfigContext
} from '@/utils/applet-config-context.ts';
import FieldTypeahead from '@/components/Form/AppletFields/FieldTypeahead.vue';

import type { ITypeaheadOption } from '@/ws/api/applets.ts';

const apiMock = vi.hoisted(() => ({
  applets: {
    callTypeaheadHandler: vi.fn()
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

type Props = {
  id: string;
  handler?: string;
  default?: string;
  placeholder?: string;
  modelValue?: string;
};

function mountField(props: Props, ctx: IAppletConfigContext | null = makeContext()) {
  return mount(FieldTypeahead, {
    props,
    attachTo: document.body,
    global: {
      provide: ctx ? { [appletConfigContextKey as symbol]: ctx } : {},
      mocks: { $t: (key: string) => key },
      stubs: {
        DFlex: { template: '<div><slot /></div>' },
        DText: { template: '<span><slot /></span>' },
        // DInput stub forwards all attrs/events so the real keyboard + value
        // flow happens against a plain <input> we can drive.
        DInput: {
          inheritAttrs: false,
          template: `<input v-bind="$attrs" />`
        }
      }
    }
  });
}

const someOptions: ITypeaheadOption[] = [
  { display: 'Amsterdam', value: 'ams' },
  { display: 'Antwerp', value: 'anr' }
];

describe('FieldTypeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMock.applets.callTypeaheadHandler.mockReset();
    apiMock.applets.callTypeaheadHandler.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces typing and calls the handler with the typed query', async () => {
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('A');
    await input.setValue('Am');
    await input.setValue('Ams');

    expect(apiMock.applets.callTypeaheadHandler).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);

    expect(apiMock.applets.callTypeaheadHandler).toHaveBeenCalledExactlyOnceWith(
      'weather',
      'search_cities',
      'Ams'
    );
  });

  it('does not fetch when the input is empty', async () => {
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    await wrapper.get('input').setValue('');
    await vi.advanceTimersByTimeAsync(250);

    expect(apiMock.applets.callTypeaheadHandler).not.toHaveBeenCalled();
  });

  it('renders returned options and selecting one stores its value and closes the list', async () => {
    apiMock.applets.callTypeaheadHandler.mockResolvedValueOnce(someOptions);
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    await wrapper.get('input').setValue('A');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    const items = wrapper.findAll('[data-testid="typeahead-option"]');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toBe('Amsterdam');

    await items[1].trigger('mousedown');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['anr']);
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Antwerp');
    expect(wrapper.find('[data-testid="typeahead-listbox"]').isVisible()).toBe(false);
  });

  it('typing after a selection clears the stored value until a new option is picked', async () => {
    apiMock.applets.callTypeaheadHandler.mockResolvedValueOnce(someOptions);
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    await wrapper.get('input').setValue('A');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    await wrapper.findAll('[data-testid="typeahead-option"]')[0].trigger('mousedown');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['ams']);

    await wrapper.get('input').setValue('Amsterdamx');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('supports keyboard navigation: arrows highlight, Enter selects, Escape closes', async () => {
    apiMock.applets.callTypeaheadHandler.mockResolvedValueOnce(someOptions);
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('A');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    await input.trigger('keydown', { key: 'ArrowDown' }); // highlight idx 1
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['anr']);
    expect(input.element.value).toBe('Antwerp');

    // Open another round, then dismiss with Escape.
    apiMock.applets.callTypeaheadHandler.mockResolvedValueOnce(someOptions);
    await input.setValue('Antwerpx');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();
    expect(wrapper.find('[data-testid="typeahead-listbox"]').isVisible()).toBe(true);

    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[data-testid="typeahead-listbox"]').isVisible()).toBe(false);
  });

  it('shows an error message when the handler rejects', async () => {
    apiMock.applets.callTypeaheadHandler.mockRejectedValueOnce(new Error('boom'));
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    await wrapper.get('input').setValue('A');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    expect(wrapper.find('[data-testid="typeahead-error"]').exists()).toBe(true);
  });

  it('shows an empty-state message when the handler returns no options', async () => {
    apiMock.applets.callTypeaheadHandler.mockResolvedValueOnce([]);
    const wrapper = mountField({ id: 'city', handler: 'search_cities' });

    await wrapper.get('input').setValue('Zzz');
    await vi.advanceTimersByTimeAsync(250);
    await flushPromises();

    expect(wrapper.find('[data-testid="typeahead-empty"]').exists()).toBe(true);
  });

  it('does not call the handler without a context or handler prop', async () => {
    const wrapper = mountField({ id: 'city', handler: 'search_cities' }, null);
    await wrapper.get('input').setValue('A');
    await vi.advanceTimersByTimeAsync(250);

    const wrapper2 = mountField({ id: 'city', handler: undefined });
    await wrapper2.get('input').setValue('A');
    await vi.advanceTimersByTimeAsync(250);

    expect(apiMock.applets.callTypeaheadHandler).not.toHaveBeenCalled();
  });

  it('initialises the input from modelValue when provided', () => {
    const wrapper = mountField({ id: 'city', handler: 'search_cities', modelValue: 'ams' });
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('ams');
  });
});
