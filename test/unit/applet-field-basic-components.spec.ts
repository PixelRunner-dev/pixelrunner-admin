import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import FieldColor from '@/components/Form/AppletFields/FieldColor.vue';
import FieldDatetime from '@/components/Form/AppletFields/FieldDatetime.vue';
import FieldOnoff from '@/components/Form/AppletFields/FieldOnoff.vue';
import FieldText from '@/components/Form/AppletFields/FieldText.vue';

const global = {
  stubs: {
    Flex: {
      template: '<div data-test="flex"><slot /></div>'
    },
    Input: {
      props: ['modelValue', 'id', 'type', 'list'],
      emits: ['update:modelValue'],
      template:
        '<input data-test="input" :id="id" :type="type" :value="modelValue" :list="list" @input="$emit(\'update:modelValue\', $event.target.value)" />'
    },
    Label: {
      props: ['for'],
      template: '<label data-test="label"><slot /></label>'
    },
    Toggle: {
      props: ['modelValue', 'id'],
      emits: ['update:modelValue'],
      template:
        '<input data-test="toggle" :id="id" type="checkbox" :data-checked="String(modelValue)" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
    }
  }
};

describe('FieldText', () => {
  it('uses model value before default text and emits updates', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(FieldText, {
      props: {
        id: 'title',
        default: 'Default title',
        modelValue: 'Current title',
        'onUpdate:modelValue': onUpdate
      },
      global
    });

    const input = wrapper.find<HTMLInputElement>('[data-test="input"]');

    expect(input.attributes('id')).toBe('title');
    expect(input.attributes('type')).toBe('text');
    expect(input.element.value).toBe('Current title');

    await input.setValue('Edited title');

    expect(onUpdate).toHaveBeenCalledWith('Edited title');
  });

  it('falls back to default and then empty string', () => {
    expect(
      mount(FieldText, {
        props: { id: 'with-default', default: 'Fallback' },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('Fallback');

    expect(
      mount(FieldText, {
        props: { id: 'without-default' },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('');
  });
});

describe('FieldOnoff', () => {
  it('uses model value before default boolean and emits updates', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(FieldOnoff, {
      props: {
        id: 'enabled',
        default: true,
        modelValue: false,
        'onUpdate:modelValue': onUpdate
      },
      global
    });

    const toggle = wrapper.find<HTMLInputElement>('[data-test="toggle"]');

    expect(toggle.attributes('id')).toBe('enabled');
    expect(toggle.element.checked).toBe(false);

    await toggle.setValue(true);

    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it('falls back to the default boolean value', () => {
    const wrapper = mount(FieldOnoff, {
      props: {
        id: 'enabled',
        default: false
      },
      global
    });

    expect(wrapper.find('[data-test="toggle"]').attributes('data-checked')).toBe('false');
  });

  it('renders a true model value', () => {
    const wrapper = mount(FieldOnoff, {
      props: {
        id: 'enabled',
        default: false,
        modelValue: true
      },
      global
    });

    expect(wrapper.find('[data-test="toggle"]').attributes('data-checked')).toBe('true');
  });

  it('renders a true default boolean value', () => {
    const wrapper = mount(FieldOnoff, {
      props: {
        id: 'enabled',
        default: true
      },
      global
    });

    expect(wrapper.find('[data-test="toggle"]').attributes('data-checked')).toBe('true');
  });
});

describe('FieldColor', () => {
  it('uses model value before default and palette values and emits updates', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(FieldColor, {
      props: {
        id: 'color',
        palette: ['#111111', '#222222'],
        default: '#333333',
        modelValue: '#444444',
        'onUpdate:modelValue': onUpdate
      },
      global
    });

    const input = wrapper.find<HTMLInputElement>('[data-test="input"]');

    expect(wrapper.find('[data-test="label"]').text()).toBe('#444444');
    expect(input.attributes('id')).toBe('color');
    expect(input.attributes('type')).toBe('color');
    expect(input.attributes('list')).toBe('color-palette');
    expect(input.element.value).toBe('#444444');
    expect(wrapper.findAll('datalist option').map((option) => option.attributes('value'))).toEqual([
      '#111111',
      '#222222'
    ]);

    await input.setValue('#555555');

    expect(onUpdate).toHaveBeenCalledWith('#555555');
  });

  it('falls back from default to first palette item to black', () => {
    expect(
      mount(FieldColor, {
        props: {
          id: 'default-color',
          palette: ['#111111'],
          default: '#333333'
        },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('#333333');

    expect(
      mount(FieldColor, {
        props: {
          id: 'palette-color',
          palette: ['#111111']
        },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('#111111');

    expect(
      mount(FieldColor, {
        props: {
          id: 'empty-color',
          palette: []
        },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('#000000');
  });
});

describe('FieldDatetime', () => {
  it('uses model value before default value and emits local datetime updates', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(FieldDatetime, {
      props: {
        id: 'starts-at',
        default: '2026-05-26T12:34:56Z',
        modelValue: '2026-06-01T01:02:03Z',
        'onUpdate:modelValue': onUpdate
      },
      global
    });

    const input = wrapper.find<HTMLInputElement>('[data-test="input"]');

    expect(input.attributes('id')).toBe('starts-at');
    expect(input.attributes('type')).toBe('datetime-local');
    expect(input.element.value).toBe('2026-06-01T01:02');

    await input.setValue('2026-06-02T03:04');

    expect(onUpdate).toHaveBeenCalledWith('2026-06-02T03:04');
  });

  it('falls back to formatted default and empty string', () => {
    expect(
      mount(FieldDatetime, {
        props: {
          id: 'with-default',
          default: '2026-05-26T12:34:56Z'
        },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('2026-05-26T12:34');

    expect(
      mount(FieldDatetime, {
        props: {
          id: 'without-default'
        },
        global
      }).find<HTMLInputElement>('[data-test="input"]').element.value
    ).toBe('');
  });
});
