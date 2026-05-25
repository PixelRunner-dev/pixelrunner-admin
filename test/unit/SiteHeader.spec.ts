import { describe, expect, it, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import SiteHeader from '@/components/SiteHeader.vue';

const routerMocks = vi.hoisted(() => ({
  route: {
    fullPath: '/settings'
  },
  router: {
    back: vi.fn(),
    options: {
      history: {
        state: {
          back: null as string | null
        }
      }
    }
  }
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMocks.route,
  useRouter: () => routerMocks.router
}));

function mountHeader() {
  return mount(SiteHeader, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="to"><slot /></a>'
        }
      }
    }
  });
}

describe('SiteHeader', () => {
  beforeEach(() => {
    routerMocks.route.fullPath = '/settings';
    routerMocks.router.options.history.state.back = null;
    routerMocks.router.back.mockClear();
  });

  it('hides the back link when router history has no previous route', () => {
    const wrapper = mountHeader();

    expect(wrapper.find('[data-test="router-back-link"]').exists()).toBe(false);
  });

  it('shows the back link and navigates back when router history has a previous route', async () => {
    routerMocks.router.options.history.state.back = '/applets';

    const wrapper = mountHeader();
    const backLink = wrapper.find('[data-test="router-back-link"]');

    expect(backLink.exists()).toBe(true);
    expect(backLink.attributes('data-to')).toBe('/applets');

    await backLink.trigger('click');

    expect(routerMocks.router.back).toHaveBeenCalledOnce();
  });
});
