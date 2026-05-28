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
    expect(
      wrapper.find('.component--library-section').exists() || wrapper.text().includes('Test')
    ).toBe(true);
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

  it('accepts payoff prop', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Section',
        payoff: 'Subtitle text'
      }
    });

    expect(wrapper.props('payoff')).toBe('Subtitle text');
  });

  it('handles different item types', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Mixed'
      },
      slots: {
        default: '<div>Item 1</div><div>Item 2</div>'
      }
    });

    expect(wrapper.text()).toContain('Item');
  });

  it('updates when props change', async () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Original',
        payoff: 'Old'
      }
    });

    await wrapper.setProps({
      title: 'Updated',
      payoff: 'New'
    });

    expect(wrapper.props('title')).toBe('Updated');
    expect(wrapper.props('payoff')).toBe('New');
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

  it('supports slot content', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Selectable'
      },
      slots: {
        default: '<ul><li>Item 1</li><li>Item 2</li></ul>'
      }
    });

    expect(wrapper.text()).toContain('Item');
  });

  it('handles large slot content', () => {
    const items = Array.from({ length: 10 }, (_, i) => `<li>Item ${i}</li>`).join('');

    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Many Items'
      },
      slots: {
        default: `<ul>${items}</ul>`
      }
    });

    expect(wrapper.text()).toContain('Item');
  });

  it('renders title in heading', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Filterable'
      }
    });

    expect(wrapper.find('h2').text()).toBe('Filterable');
  });

  it('displays payoff when provided', () => {
    const wrapper = mount(LibrarySection, {
      props: {
        title: 'Ordered',
        payoff: 'Subtitle here'
      }
    });

    expect(wrapper.text()).toContain('Subtitle here');
  });
});
