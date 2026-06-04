import { mount } from '@vue/test-utils';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import AppletCarousel from '@/components/Applet/AppletCarousel.vue';
import AppletDetails from '@/components/Applet/AppletDetails.vue';
import AppletItem from '@/components/Applet/AppletItem.vue';

import type { IFullApplet, UUID } from 'pixelrunner-shared';

const carouselMock = vi.hoisted(() => ({
  destroy: vi.fn(),
  constructor: vi.fn()
}));

vi.mock('@/adapters/CarouselAdapter.ts', () => ({
  Carousel: vi.fn(function MockCarousel(options: unknown) {
    carouselMock.constructor(options);
    return { destroy: carouselMock.destroy };
  })
}));

beforeEach(() => {
  carouselMock.destroy.mockClear();
  carouselMock.constructor.mockClear();
});

beforeAll(async () => {
  await i18next.init({
    lng: 'cimode',
    resources: {}
  });
});

describe('AppletCarousel', () => {
  it('initializes and destroys Carousel around rendered applet list', () => {
    const applets = [makeApplet('weather'), makeApplet('clock')];
    const wrapper = mount(AppletCarousel, {
      props: {
        applets,
        itemWidth: 'wide'
      },
      slots: {
        item: '<span class="slot-applet">{{ params.packageName }}</span>'
      },
      global: carouselGlobal()
    });

    expect(carouselMock.constructor).toHaveBeenCalledWith({ container: wrapper.element });
    expect(wrapper.find('[data-testid="applet-list"]').attributes('data-list-class')).toBe(
      'carousel__track'
    );
    expect(wrapper.find('[data-testid="applet-list"]').attributes('data-item-class')).toBe(
      'carousel__track__item carousel__item-width--wide'
    );
    expect(wrapper.findAll('.slot-applet').map((node) => node.text())).toEqual([
      'weather',
      'clock'
    ]);

    wrapper.unmount();
    expect(carouselMock.destroy).toHaveBeenCalledOnce();
  });

  it('uses default item width when no width prop is provided', () => {
    const wrapper = mount(AppletCarousel, {
      props: {
        applets: [makeApplet('weather')]
      },
      global: carouselGlobal()
    });

    expect(wrapper.find('[data-testid="applet-list"]').attributes('data-item-class')).toContain(
      'carousel__item-width--default'
    );
  });
});

describe('AppletDetails', () => {
  it('renders compact horizontal details without author or long description', () => {
    const wrapper = mountDetails({ view: 'horizontal' });
    const title = wrapper.get('[data-testid="applet-details-title"]');

    expect(title.element.tagName).toBe('H2');
    expect(title.text()).toBe('Weather');
    expect(wrapper.find('h1').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('[By]');
    expect(wrapper.text()).not.toContain('Detailed forecast');
  });

  it('renders preview author and official badge', () => {
    const wrapper = mountDetails({ isOfficialApplet: true, view: 'preview' });
    const title = wrapper.get('[data-testid="applet-details-title"]');

    expect(title.element.tagName).toBe('H3');
    expect(title.text()).toContain('Weather');
    expect(wrapper.find('.badge').exists()).toBe(true);
    expect(wrapper.find('p.text-xs').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Detailed forecast');
  });

  it('renders full detail with h1, summary, description, and spacing class', () => {
    const wrapper = mountDetails({ view: 'full-detail' });
    const title = wrapper.get('[data-testid="applet-details-title"]');

    expect(title.element.tagName).toBe('H1');
    expect(title.text()).toBe('Weather');
    expect(wrapper.text()).toContain('Forecast summary');
    expect(wrapper.text()).toContain('Detailed forecast');
    expect(wrapper.find('.component--applet-details').classes()).toContain('my-4');
  });
});

describe('AppletItem', () => {
  it('forwards the full applet object to the item slot', () => {
    const applet = makeApplet('weather');
    const wrapper = mount(AppletItem, {
      props: { applet },
      slots: {
        item: '<span>{{ params.packageName }} {{ params.details.name }}</span>'
      }
    });

    expect(wrapper.text()).toBe('weather Weather');
  });
});

function carouselGlobal() {
  return {
    plugins: [i18nPlugin()],
    stubs: {
      AppletList: {
        props: ['applets', 'classes'],
        template:
          '<div data-testid="applet-list" :data-list-class="classes.list" :data-item-class="classes.item"><div v-for="applet in applets" :key="applet.packageName"><slot name="item" v-bind="applet" /></div></div>'
      }
    }
  };
}

function mountDetails(options: {
  isOfficialApplet?: boolean;
  view: 'horizontal' | 'preview' | 'full-detail';
}) {
  return mount(AppletDetails, {
    props: {
      name: 'Weather',
      summary: 'Forecast summary',
      desc: 'Detailed forecast',
      author: 'Pixelrunner',
      isOfficialApplet: options.isOfficialApplet,
      view: options.view
    },
    global: {
      plugins: [i18nPlugin()],
      stubs: {
        DFlex: {
          props: ['class'],
          template: '<div class="component--applet-details"><slot /></div>'
        }
      }
    }
  });
}

function i18nPlugin() {
  return [I18NextVue, { i18next }] as [typeof I18NextVue, { i18next: typeof i18next }];
}

function makeApplet(packageName: string): IFullApplet {
  return {
    packageName,
    fileName: `${packageName}.star`,
    details: {
      name: packageName === 'weather' ? 'Weather' : 'Clock',
      summary: packageName,
      desc: packageName,
      author: 'Pixelrunner'
    },
    defaultImage: {
      src: `/${packageName}.webp`,
      alt: packageName,
      dateCreated: new Date('2026-01-01T00:00:00.000Z')
    },
    categories: [],
    installationDetails: {
      uuid: `${packageName}-uuid` as UUID,
      image: {
        src: `/${packageName}-installed.webp`,
        alt: `${packageName} installed`,
        dateCreated: new Date('2026-01-02T00:00:00.000Z')
      },
      appliedConfigurations: {
        appId: packageName,
        config: {}
      },
      isHidden: false,
      isPinned: false
    },
    isInstalled: true
  };
}
