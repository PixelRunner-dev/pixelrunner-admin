import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import AppletCard from '@/components/Applet/AppletCard.vue';

import type { IFullApplet, UUID } from 'pixelrunner-shared';

describe('AppletCard', () => {
  it('renders an uninstalled applet as a library link with the default image', () => {
    const applet = makeApplet({ installed: false });
    const wrapper = mountCard(applet);

    expect(wrapper.classes()).toContain('component--applet-card');
    expect(wrapper.classes()).toContain('applet-card--horizontal');
    expect(wrapper.getComponent({ name: 'RouterLink' }).props('to')).toBe(
      '/library/applets/weather'
    );
    expect(wrapper.getComponent({ name: 'AppletImage' }).props()).toMatchObject({
      src: '/default.webp',
      alt: 'Weather default'
    });
    expect(wrapper.getComponent({ name: 'AppletDetails' }).props()).toMatchObject({
      name: 'Weather',
      view: 'horizontal'
    });
  });

  it('uses installed image and state classes when installation details exist', () => {
    const applet = makeApplet({
      installed: true,
      isHidden: true,
      isPinned: true,
      installedImageSrc: '/installed.webp'
    });
    const wrapper = mountCard(applet, { view: 'vertical' });

    expect(wrapper.classes()).toContain('applet-card--vertical');
    expect(wrapper.classes()).toContain('applet-card--is-hidden');
    expect(wrapper.classes()).toContain('applet-card--is-pinned');
    expect(wrapper.getComponent({ name: 'AppletImage' }).props()).toMatchObject({
      src: '/installed.webp',
      alt: 'Weather installed'
    });
    expect(wrapper.getComponent({ name: 'AppletDetails' }).props('view')).toBe('vertical');
  });

  it('renders installed call to action as applet config link with slot content', () => {
    const applet = makeApplet({ installed: true });
    const wrapper = mountCard(applet, {
      hasCallToAction: true,
      slots: {
        cta: 'Configure'
      }
    });
    const links = wrapper.findAllComponents({ name: 'RouterLink' });

    expect(links).toHaveLength(1);
    expect(links[0]?.props('to')).toBe('/applets/weather-uuid');
    expect(links[0]?.text()).toBe('Configure');
    expect(wrapper.get('figure').element.parentElement?.tagName).toBe('DIV');
  });

  it('does not render a CTA or library link for uninstalled call-to-action cards', () => {
    const applet = makeApplet({ installed: false });
    const wrapper = mountCard(applet, {
      hasCallToAction: true,
      view: 'preview',
      slots: {
        cta: 'Install'
      }
    });

    expect(wrapper.classes()).toContain('applet-card--preview');
    expect(wrapper.findAllComponents({ name: 'RouterLink' })).toHaveLength(0);
    expect(wrapper.get('figure').element.parentElement?.tagName).toBe('DIV');
    expect(wrapper.text()).not.toContain('Install');
  });

  it('falls back to default image when an installed applet has no installed image', () => {
    const applet = makeApplet({
      installed: true,
      installedImageSrc: null
    });
    const wrapper = mountCard(applet);

    expect(wrapper.getComponent({ name: 'AppletImage' }).props()).toMatchObject({
      src: '/default.webp',
      alt: 'Weather default'
    });
  });
});

type CardMountOptions = {
  hasCallToAction?: boolean;
  slots?: Record<string, string>;
  view?: 'horizontal' | 'vertical' | 'preview' | 'full-detail';
};

function mountCard(applet: IFullApplet, options: CardMountOptions = {}) {
  return mount(AppletCard, {
    props: {
      applet,
      hasCallToAction: options.hasCallToAction,
      view: options.view
    },
    slots: options.slots,
    global: {
      stubs: {
        AppletDetails: {
          name: 'AppletDetails',
          props: ['author', 'desc', 'isOfficialApplet', 'name', 'summary', 'view'],
          template: '<section class="applet-details">{{ name }} {{ view }}</section>'
        },
        AppletImage: {
          name: 'AppletImage',
          props: ['alt', 'dateCreated', 'dateModified', 'src'],
          template: '<img class="applet-image" :src="src" :alt="alt" />'
        },
        DFlex: {
          props: ['is'],
          template: '<component :is="is || `div`"><slot /></component>'
        },
        RouterLink: {
          name: 'RouterLink',
          props: ['to'],
          template: '<a :href="to"><slot /></a>'
        }
      }
    }
  });
}

function makeApplet(options: {
  installed: boolean;
  installedImageSrc?: string | null;
  isHidden?: boolean;
  isPinned?: boolean;
}): IFullApplet {
  const applet: IFullApplet = {
    packageName: 'weather',
    fileName: 'weather.star',
    details: {
      name: 'Weather',
      summary: 'Forecast',
      desc: 'Forecast applet',
      author: 'Pixelrunner'
    },
    defaultImage: {
      src: '/default.webp',
      alt: 'Weather default',
      dateCreated: new Date('2026-01-01T00:00:00.000Z')
    },
    categories: [],
    isInstalled: options.installed
  };

  if (options.installed) {
    const installationDetails = {
      uuid: 'weather-uuid' as UUID,
      image: {
        src: options.installedImageSrc ?? '/installed.webp',
        alt: 'Weather installed',
        dateCreated: new Date('2026-01-02T00:00:00.000Z')
      },
      appliedConfigurations: {
        appId: 'weather',
        config: {}
      },
      isHidden: options.isHidden ?? false,
      isPinned: options.isPinned ?? false
    };

    if (options.installedImageSrc === null) {
      delete (installationDetails as Partial<typeof installationDetails>).image;
    }

    applet.installationDetails = installationDetails;
  }

  return applet;
}
