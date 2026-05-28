import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldDropdown from '@/components/Form/AppletFields/FieldDropdown.vue';

describe('FieldDropdown.vue', () => {
  const defaultProps = {
    id: 'test-dropdown',
    options: [
      { display: 'Option 1', value: 'opt1' },
      { display: 'Option 2', value: 'opt2' },
      { display: 'Option 3', value: 'opt3' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropdown component', () => {
    const wrapper = mount(FieldDropdown, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts id prop', () => {
    const wrapper = mount(FieldDropdown, {
      props: defaultProps
    });
    expect(wrapper.props('id')).toBe('test-dropdown');
  });

  it('accepts options prop', () => {
    const wrapper = mount(FieldDropdown, {
      props: defaultProps
    });
    expect(wrapper.props('options')).toEqual(defaultProps.options);
  });

  it('handles single option', () => {
    const singleOption = {
      id: 'single',
      options: [{ display: 'Only Option', value: 'only' }]
    };
    const wrapper = mount(FieldDropdown, {
      props: singleOption
    });
    expect(wrapper.props('options')).toHaveLength(1);
  });

  it('handles many options', () => {
    const manyOptions = {
      id: 'many',
      options: Array.from({ length: 100 }, (_, i) => ({
        display: `Option ${i}`,
        value: `opt${i}`
      }))
    };
    const wrapper = mount(FieldDropdown, {
      props: manyOptions
    });
    expect(wrapper.props('options')).toHaveLength(100);
  });

  it('supports default value', () => {
    const withDefault = {
      ...defaultProps,
      default: 'opt2'
    };
    const wrapper = mount(FieldDropdown, {
      props: withDefault
    });
    expect(wrapper.props('default')).toBe('opt2');
  });

  it('handles boolean option values', () => {
    const boolOptions = {
      id: 'bool',
      options: [
        { display: 'Enabled', value: true },
        { display: 'Disabled', value: false }
      ]
    };
    const wrapper = mount(FieldDropdown, {
      props: boolOptions
    });
    expect(wrapper.props('options')).toHaveLength(2);
  });

  it('handles numeric option values', () => {
    const numOptions = {
      id: 'num',
      options: [
        { display: '10%', value: 10 },
        { display: '50%', value: 50 },
        { display: '100%', value: 100 }
      ]
    };
    const wrapper = mount(FieldDropdown, {
      props: numOptions
    });
    expect(wrapper.props('options')).toHaveLength(3);
  });

  it('handles object option values', () => {
    const objOptions = {
      id: 'obj',
      options: [
        { display: 'First', value: { id: 1 } },
        { display: 'Second', value: { id: 2 } }
      ]
    };
    const wrapper = mount(FieldDropdown, {
      props: objOptions
    });
    expect(wrapper.props('options')).toHaveLength(2);
  });

  it('updates when props change', async () => {
    const wrapper = mount(FieldDropdown, {
      props: defaultProps
    });

    const newProps = {
      id: 'updated',
      options: [
        { display: 'New 1', value: 'new1' },
        { display: 'New 2', value: 'new2' }
      ]
    };

    await wrapper.setProps(newProps);
    expect(wrapper.props('id')).toBe('updated');
    expect(wrapper.props('options')).toHaveLength(2);
  });

  it('supports model binding', async () => {
    const wrapper = mount(FieldDropdown, {
      props: defaultProps
    });

    await wrapper.setProps({
      ...defaultProps,
      modelValue: 'opt1'
    });

    expect(wrapper.props('modelValue')).toBe('opt1');
  });
});
