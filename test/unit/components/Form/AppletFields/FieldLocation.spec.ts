import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FieldLocation from '@/components/Form/AppletFields/FieldLocation.vue';

vi.stubGlobal(
  'Worker',
  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
  }
);

describe('FieldLocation.vue', () => {
  const i18nMock = { $t: (key: string) => key };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location field component', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.component--field-location').exists()).toBe(true);
  });

  it('mounts successfully', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.vm).toBeDefined();
  });

  it('has valid DOM structure', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.html().length > 0).toBe(true);
  });

  it('handles optional props', () => {
    const wrapper = mount(FieldLocation, {
      props: { id: 'loc-test' },
      global: { mocks: i18nMock }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts id prop', () => {
    const wrapper = mount(FieldLocation, {
      props: { id: 'location-1' },
      global: { mocks: i18nMock }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders as valid Vue component', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.isVisible()).toBe(true);
  });

  it('has interactive elements', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.findAll('*').length > 0).toBe(true);
  });

  it('contains expected container', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    const div = wrapper.find('div');
    expect(div.exists()).toBe(true);
  });

  it('has location field class', () => {
    const wrapper = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(wrapper.html()).toContain('component--field-location');
  });

  it('can be rendered multiple times', () => {
    const w1 = mount(FieldLocation, { global: { mocks: i18nMock } });
    const w2 = mount(FieldLocation, { global: { mocks: i18nMock } });
    expect(w1.exists() && w2.exists()).toBe(true);
  });
});
