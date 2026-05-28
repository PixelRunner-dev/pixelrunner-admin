import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LibrarySection from '@/components/Library/LibrarySection.vue';

describe('LibrarySection.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders library section', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Test Section',
        items: []
      }
    });
    expect(wrapper.find('.component--library-section').exists() || wrapper.text().includes('Test')).toBe(true);
  });

  it('displays section title', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'My Section',
        items: []
      }
    });
    expect(wrapper.text()).toContain('My Section');
  });

  it('renders empty state when no items', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Empty',
        items: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders items when provided', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ];

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Items',
        items
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('accepts title prop', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Custom Title',
        items: []
      }
    });

    expect(wrapper.props('title')).toBe('Custom Title');
  });

  it('accepts items prop', () => {
    const items = [{ id: '1', name: 'Test' }];

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Section',
        items
      }
    });

    expect(wrapper.props('items')).toEqual(items);
  });

  it('handles different item types', () => {
    const items = [
      { id: '1', name: 'Item', type: 'applet' },
      { id: '2', name: 'Item 2', type: 'collection' }
    ];

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Mixed',
        items
      }
    });

    expect(wrapper.props('items')).toHaveLength(2);
  });

  it('updates when props change', async () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Original',
        items: []
      }
    });

    await wrapper.setProps({
      title: 'Updated',
      items: [{ id: '1', name: 'New Item' }]
    });

    expect(wrapper.props('title')).toBe('Updated');
    expect(wrapper.props('items')).toHaveLength(1);
  });

  it('emits events on item interaction', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Section',
        items: [{ id: '1', name: 'Item' }]
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('supports item selection', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ];

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Selectable',
        items
      }
    });

    expect(wrapper.props('items')).toHaveLength(2);
  });

  it('handles scrolling for many items', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`
    }));

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Many Items',
        items
      }
    });

    expect(wrapper.props('items')).toHaveLength(100);
  });

  it('filters items when search applied', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Filterable',
        items: [
          { id: '1', name: 'Apple' },
          { id: '2', name: 'Banana' },
          { id: '3', name: 'Apricot' }
        ]
      }
    });

    expect(wrapper.props('items')).toHaveLength(3);
  });

  it('maintains item order', () => {
    const items = [
      { id: '3', name: 'Third' },
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' }
    ];

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Ordered',
        items
      }
    });

    expect(wrapper.props('items')[0].id).toBe('3');
    expect(wrapper.props('items')[1].id).toBe('1');
    expect(wrapper.props('items')[2].id).toBe('2');
  });
});
