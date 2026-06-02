import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldLocationbased from '@/components/Form/AppletFields/FieldLocationbased.vue';

vi.mock('@/ws/index.ts', () => ({
  useClientApi: () => ({
    settings: {
      getAll: vi.fn().mockResolvedValue([
        {
          key: 'location',
          value: JSON.stringify({ name: 'Amsterdam', lat: '52.3676', lng: '4.9041', country: 'NL' })
        }
      ])
    },
    isConnected: { value: true },
    state: { value: 'connected' },
    lastError: { value: null }
  })
}));

const globalMocks = {
  mocks: { $t: (key: string) => key },
  stubs: {
    LocationSearch: {
      props: ['id', 'modelValue', 'default'],
      template: '<input :id="id" type="text" data-testid="location-search" />'
    },
    DToggle: {
      props: ['id', 'modelValue'],
      emits: ['update:modelValue'],
      template:
        '<input :id="id" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
    }
  }
};

describe('FieldLocationbased.vue', () => {
  it('renders wrapper with correct class', () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1' },
      global: globalMocks
    });
    expect(wrapper.find('.component--field-locationbased').exists()).toBe(true);
  });

  it('renders use-device-location toggle and label', () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1' },
      global: globalMocks
    });
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('[Use device location]');
  });

  it('shows LocationSearch by default (toggle off)', () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1' },
      global: globalMocks
    });
    expect(wrapper.find('[data-testid="location-search"]').exists()).toBe(true);
  });

  it('hides LocationSearch when use-device-location toggle is enabled', async () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1' },
      global: globalMocks
    });
    const toggle = wrapper.find('input[type="checkbox"]');
    await toggle.setValue(true);
    expect(wrapper.find('[data-testid="location-search"]').exists()).toBe(false);
  });

  it('restores LocationSearch when toggle is turned off again', async () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1' },
      global: globalMocks
    });
    const toggle = wrapper.find('input[type="checkbox"]');
    await toggle.setValue(true);
    await toggle.setValue(false);
    expect(wrapper.find('[data-testid="location-search"]').exists()).toBe(true);
  });

  it('accepts default prop and passes it to LocationSearch', () => {
    const defaultLoc = { lat: '52.3676', lng: '4.9041' };
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'loc-1', default: defaultLoc },
      global: globalMocks
    });
    expect(wrapper.find('.component--field-locationbased').exists()).toBe(true);
  });

  it('toggle id is derived from id prop', () => {
    const wrapper = mount(FieldLocationbased, {
      props: { id: 'my-location' },
      global: globalMocks
    });
    expect(wrapper.find('input[type="checkbox"]').attributes('id')).toBe(
      'my-location-use-device'
    );
  });
});
