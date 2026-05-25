import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';

import { mount } from '@vue/test-utils';

import App from '@/App.vue';

describe('App', () => {
  it('renders the application shell for local access', async () => {
    const wrapper = mount(App, {
      global: {
        provide: {
          accessMode: 'local'
        },
        stubs: {
          SiteHeader: { template: '<nav data-test="site-header" />' },
          SiteNotifications: { template: '<div data-test="site-notifications" />' },
          RouterView: { template: '<main data-test="router-view" />' },
          IconSprite: { template: '<svg data-test="icon-sprite" />' }
        }
      }
    });

    await nextTick();

    expect(wrapper.find('[data-test="site-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true);
  });
});
