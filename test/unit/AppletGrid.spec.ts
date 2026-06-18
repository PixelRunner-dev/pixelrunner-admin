import { beforeAll, describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';

import AppletGrid from '@/components/Applet/AppletGrid.vue';

import type { IFullApplet } from 'pixelrunner-shared';

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.init({ lng: 'cimode', resources: {} });
  }
});

// AppletList does the actual slicing (covered by its own spec); here we only
// assert AppletGrid feeds it the right offset and keeps it in sync with the URL.
const AppletListStub = {
  props: ['applets', 'limit', 'offset', 'classes'],
  template: '<div class="applet-list-stub" :data-offset="offset" :data-limit="limit" />'
};

function makeApplets(count: number): IFullApplet[] {
  return Array.from({ length: count }, (_, i) => ({ packageName: `applet-${i}` }) as IFullApplet);
}

async function mountGrid(applets: IFullApplet[], initialPath = '/') {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  });

  await router.push(initialPath);
  await router.isReady();

  const wrapper = mount(AppletGrid, {
    props: { applets },
    global: {
      plugins: [router],
      stubs: { AppletList: AppletListStub }
    }
  });

  return { wrapper, router };
}

function offset(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('.applet-list-stub').attributes('data-offset');
}

describe('AppletGrid pagination via URL', () => {
  it('defaults to page 1 (offset 0) with no query param', async () => {
    const { wrapper } = await mountGrid(makeApplets(45));
    expect(offset(wrapper)).toBe('0');
  });

  it('reads the initial page from ?page and computes the offset', async () => {
    const { wrapper } = await mountGrid(makeApplets(45), '/?page=2');
    expect(offset(wrapper)).toBe('20');
  });

  it('writes ?page to the URL when paginating forward', async () => {
    const { wrapper, router } = await mountGrid(makeApplets(45));
    const next = wrapper.findAll('button')[2];

    await next.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query.page).toBe('2');
    expect(offset(wrapper)).toBe('20');
  });

  it('omits page=1 from the URL when returning to the first page', async () => {
    const { wrapper, router } = await mountGrid(makeApplets(45), '/?page=2');
    const prev = wrapper.findAll('button')[0];

    await prev.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query.page).toBeUndefined();
    expect(offset(wrapper)).toBe('0');
  });

  it('clamps an out-of-range ?page to the last page', async () => {
    // 45 applets / 20 per page => 3 pages; page 99 clamps to 3 (offset 40)
    const { wrapper } = await mountGrid(makeApplets(45), '/?page=99');
    expect(offset(wrapper)).toBe('40');
  });

  it('hides the pagination nav when everything fits on one page', async () => {
    const { wrapper } = await mountGrid(makeApplets(10));
    expect(wrapper.find('nav').exists()).toBe(false);
  });
});
