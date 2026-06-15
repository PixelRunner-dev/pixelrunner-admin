import { beforeAll, describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { mount } from '@vue/test-utils';

import PaginationNavigation from '@/components/PaginationNavigation.vue';

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.init({ lng: 'cimode', resources: {} });
  }
});

function mountNav(props: { page: number; total: number; pageSize: number }) {
  return mount(PaginationNavigation, { props });
}

describe('PaginationNavigation', () => {
  it('renders nothing when everything fits on one page', () => {
    const wrapper = mountNav({ page: 1, total: 20, pageSize: 20 });
    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('renders prev/status/next across multiple pages', () => {
    const wrapper = mountNav({ page: 2, total: 45, pageSize: 20 });
    expect(wrapper.find('nav').exists()).toBe(true);
    // total 45 / 20 => 3 pages, prev + status + next = 3 buttons
    expect(wrapper.findAll('button')).toHaveLength(3);
  });

  it('disables prev on first page and next on last page', () => {
    const first = mountNav({ page: 1, total: 60, pageSize: 20 });
    const buttons = first.findAll('button');
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[2].attributes('disabled')).toBeUndefined();

    const last = mountNav({ page: 3, total: 60, pageSize: 20 });
    const lastButtons = last.findAll('button');
    expect(lastButtons[0].attributes('disabled')).toBeUndefined();
    expect(lastButtons[2].attributes('disabled')).toBeDefined();
  });

  it('emits clamped page on next/prev clicks', async () => {
    const wrapper = mountNav({ page: 2, total: 60, pageSize: 20 });
    const buttons = wrapper.findAll('button');

    await buttons[2].trigger('click'); // next -> 3
    await buttons[0].trigger('click'); // prev -> 1

    expect(wrapper.emitted('update:page')).toEqual([[3], [1]]);
  });

  it('does not emit when navigating past the bounds', async () => {
    const wrapper = mountNav({ page: 1, total: 60, pageSize: 20 });
    // disabled prev still gets a programmatic click; go() clamps and skips equal page
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('update:page')).toBeUndefined();
  });
});
