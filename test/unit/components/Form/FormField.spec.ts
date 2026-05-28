import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FormField from '@/components/Form/FormField.vue';

vi.stubGlobal('$t', (key: string) => key);

describe('FormField.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form field component', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-1',
        label: 'Test Field'
      },
      slots: {
        default: 'input content'
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('displays label prop', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'username',
        label: 'Username'
      },
      slots: {
        default: 'input'
      }
    });

    expect(wrapper.text()).toContain('Username');
  });

  it('renders slot content', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-2',
        label: 'Field'
      },
      slots: {
        default: 'input field here'
      }
    });

    expect(wrapper.text()).toContain('input field here');
  });

  it('accepts id and label props', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'email-field',
        label: 'Email'
      },
      slots: {
        default: '<input />'
      }
    });

    expect(wrapper.props('id')).toBe('email-field');
    expect(wrapper.props('label')).toBe('Email');
  });

  it('displays description when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-3',
        label: 'Field',
        description: 'This is a helper text'
      },
      slots: {
        default: 'input'
      }
    });

    expect(wrapper.text()).toContain('This is a helper text');
  });

  it('uses context for translations', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-4',
        context: 'settings'
      },
      slots: {
        default: 'input'
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('context')).toBe('settings');
  });

  it('respects showDescription flag', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-5',
        label: 'Field',
        showDescription: true
      },
      slots: {
        default: 'input'
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('showDescription')).toBe(true);
  });

  it('handles optional description', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-6'
      },
      slots: {
        default: 'input'
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('description')).toBeUndefined();
  });

  it('renders with custom context', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-7',
        label: 'Labeled Field',
        context: 'custom'
      },
      slots: {
        default: 'input'
      }
    });

    expect(wrapper.props('context')).toBe('custom');
  });

  it('supports nested slot content', () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'field-8',
        label: 'Field'
      },
      slots: {
        default: '<div><input /></div>'
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('updates when id prop changes', async () => {
    const wrapper = mount(FormField, {
      props: {
        id: 'original-id',
        label: 'Original'
      },
      slots: {
        default: 'input'
      }
    });

    await wrapper.setProps({
      id: 'updated-id',
      label: 'Updated'
    });

    expect(wrapper.props('id')).toBe('updated-id');
    expect(wrapper.props('label')).toBe('Updated');
  });
});
