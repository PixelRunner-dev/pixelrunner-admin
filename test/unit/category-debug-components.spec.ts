import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CategoryList from '@/components/CategoryList.vue';
import DebugSection from '@/components/DebugSection.vue';

import type { ICategory } from 'pixelrunner-shared';

const categories = [
  {
    key: 'clock',
    icon: {
      iconId: 'icon--clock',
      alt: 'Clock'
    }
  },
  {
    key: 'weather',
    icon: {
      iconId: 'icon--cloud',
      alt: 'Weather'
    }
  }
] as ICategory[];

const mountCategoryList = (props: Partial<InstanceType<typeof CategoryList>['$props']> = {}) =>
  mount(CategoryList, {
    props: {
      categories,
      ...props
    },
    global: {
      mocks: {
        $t: (key: string) => `translated:${key}`
      },
      stubs: {
        IconImage: {
          props: ['iconId', 'className'],
          template: '<span data-test="category-icon" :data-icon-id="iconId" :class="className" />'
        },
        RouterLink: {
          props: ['to'],
          template: '<a data-test="category-link" :href="to"><slot /></a>'
        }
      }
    }
  });

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.1234);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CategoryList', () => {
  it('renders a non-interactive column list by default', () => {
    const wrapper = mountCategoryList();

    expect(wrapper.element.tagName).toBe('UL');
    expect(wrapper.classes()).toContain('component--category-list');
    expect(wrapper.classes()).toContain('columns-2');
    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.findAll('[data-test="category-icon"]')).toHaveLength(2);
    expect(wrapper.find('[data-test="category-link"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('translated:applet.category.clock.label');
    expect(wrapper.text()).toContain('translated:applet.category.weather.label');
  });

  it('renders an interactive sorted inline list with router links', () => {
    const wrapper = mountCategoryList({
      hasItemsInline: true,
      hasSorting: true,
      isInteractive: true
    });

    expect(wrapper.element.tagName).toBe('OL');
    expect(wrapper.classes()).toContain('menu');
    expect(wrapper.classes()).toContain('menu-horizontal');
    expect(wrapper.classes()).not.toContain('columns-2');

    const links = wrapper.findAll('[data-test="category-link"]');
    expect(links).toHaveLength(2);
    expect(links[0]?.attributes('href')).toBe('/library/categories/clock');
    expect(links[1]?.attributes('href')).toBe('/library/categories/weather');
    expect(wrapper.find('li')?.classes()).not.toContain('break-inside-avoid');
  });

  it('handles an empty category list', () => {
    const wrapper = mountCategoryList({
      categories: []
    });

    expect(wrapper.findAll('li')).toEqual([]);
    expect(wrapper.text()).toBe('');
  });
});

describe('DebugSection', () => {
  it('renders object data, raw data, line numbers, and slot content', async () => {
    const wrapper = mount(DebugSection, {
      props: {
        data: {
          status: 'ok',
          count: 2
        }
      },
      slots: {
        default: '<p data-test="debug-slot">Extra debug detail</p>'
      }
    });

    await nextTick();
    await nextTick();

    expect(wrapper.text()).toContain('Debug');
    expect(wrapper.text()).toContain('status');
    expect(wrapper.text()).toContain('ok');
    expect(wrapper.text()).toContain('count');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.find('[data-test="debug-slot"]').exists()).toBe(true);
    expect(wrapper.find('hr').exists()).toBe(true);
    expect(wrapper.findAll('pre.hasLineNumbers .line').length).toBeGreaterThan(0);
  });

  it('renders array data by numeric index', () => {
    const wrapper = mount(DebugSection, {
      props: {
        data: ['first', 'second']
      }
    });

    expect(wrapper.text()).toContain('0');
    expect(wrapper.text()).toContain('first');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('second');
  });

  it('renders unsupported object data without key-value rows', async () => {
    const wrapper = mount(DebugSection, {
      props: {
        data: new Date('2026-05-26T00:00:00Z')
      }
    });

    await nextTick();
    await nextTick();

    expect(wrapper.find('dl').exists()).toBe(true);
    expect(wrapper.findAll('dl > div')).toHaveLength(0);
    expect(wrapper.find('details').exists()).toBe(true);
  });

  it('renders only the shell and slot when data is missing', () => {
    const wrapper = mount(DebugSection, {
      slots: {
        default: '<p data-test="debug-slot">Only slot</p>'
      }
    });

    expect(wrapper.text()).toContain('Debug');
    expect(wrapper.find('dl').exists()).toBe(false);
    expect(wrapper.find('details').exists()).toBe(false);
    expect(wrapper.find('hr').exists()).toBe(false);
    expect(wrapper.find('[data-test="debug-slot"]').exists()).toBe(true);
  });

  it('updates line numbers when data changes', async () => {
    const wrapper = mount(DebugSection, {
      props: {
        data: {
          value: 'before'
        }
      }
    });

    await nextTick();
    await nextTick();

    const firstLineCount = wrapper.findAll('pre.hasLineNumbers .line').length;

    await wrapper.setProps({
      data: {
        value: 'after',
        next: true
      }
    });
    await nextTick();
    await nextTick();

    expect(wrapper.text()).toContain('after');
    expect(wrapper.findAll('pre.hasLineNumbers .line').length).toBeGreaterThan(firstLineCount);
  });

  it('selects raw debug data on triple click only', async () => {
    const removeAllRanges = vi.fn();
    const addRange = vi.fn();
    vi.spyOn(window, 'getSelection').mockReturnValue({
      removeAllRanges,
      addRange
    } as unknown as Selection);

    const wrapper = mount(DebugSection, {
      props: {
        data: {
          status: 'ok'
        }
      }
    });

    await nextTick();
    await nextTick();

    const rawData = wrapper.find('pre.hasLineNumbers');
    rawData.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
    await nextTick();
    expect(addRange).not.toHaveBeenCalled();

    rawData.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 3 }));
    await nextTick();

    expect(removeAllRanges).toHaveBeenCalledOnce();
    expect(addRange).toHaveBeenCalledOnce();
  });

  it('ignores triple click when the browser returns no selection', async () => {
    vi.spyOn(window, 'getSelection').mockReturnValue(null);

    const wrapper = mount(DebugSection, {
      props: {
        data: {
          status: 'ok'
        }
      }
    });

    await nextTick();
    await nextTick();

    const rawData = wrapper.find('pre.hasLineNumbers');

    expect(() => {
      rawData.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 3 }));
    }).not.toThrow();
  });
});
