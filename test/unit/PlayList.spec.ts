import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PlayList from '@/components/PlayList.vue';

import type { IFullApplet, IInstalledApplet, IPlaylist, UUID } from 'pixelrunner-shared';

describe('PlayList', () => {
  it('renders AppletList with playlist applets, drag classes and default save state', () => {
    const playlist = createPlaylist();
    const wrapper = mountPlaylist(playlist);
    const list = wrapper.getComponent({ name: 'AppletList' });

    expect(wrapper.classes()).toEqual(['component--playlist', 'my-4']);
    expect(wrapper.attributes('data-created')).toContain('2026');
    expect(wrapper.attributes('data-modified')).toContain('2026');
    expect(list.props()).toEqual(
      expect.objectContaining({
        applets: playlist.applets,
        isDragable: true,
        isReorderPending: false
      })
    );
    expect(wrapper.find('[data-testid="empty-playlist"]').exists()).toBe(false);
  });

  it('passes pending save state through to AppletList', () => {
    const wrapper = mountPlaylist(createPlaylist(), { isSavingOrder: true });

    expect(wrapper.getComponent({ name: 'AppletList' }).props('isReorderPending')).toBe(true);
  });

  it('renders AppletCard item slots with configure CTA text', () => {
    const wrapper = mountPlaylist(createPlaylist());

    expect(wrapper.findAll('[data-testid="applet-card"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('card:clock:call-to-action:true');
    expect(wrapper.text()).toContain('card:weather:call-to-action:true');
    expect(wrapper.text()).toContain('t:applet.cta.configure');
  });

  it('emits installed playlist applets when AppletList reports a reordered full applet list', async () => {
    const playlist = createPlaylist();
    const wrapper = mountPlaylist(playlist);
    const reordered = [playlist.applets[1], playlist.applets[0]] as IFullApplet[];

    await wrapper.getComponent({ name: 'AppletList' }).vm.$emit('reordered', reordered);

    expect(wrapper.emitted('reorder')).toEqual([[reordered]]);
  });

  it('renders translated empty state instead of AppletList for empty playlists', () => {
    const wrapper = mountPlaylist(createPlaylist({ applets: [], dateModified: undefined }));

    expect(wrapper.findComponent({ name: 'AppletList' }).exists()).toBe(false);
    expect(wrapper.get('.bg-base-200').classes()).toEqual([
      'bg-base-200',
      'rounded-box',
      'my-4',
      'p-4',
      'shadow-sm'
    ]);
    expect(wrapper.text()).toContain('t:listPage.playlist.noAppletsInPlaylist');
    expect(wrapper.attributes('data-modified')).toBeUndefined();
  });
});

function mountPlaylist(
  playlist: IPlaylist,
  options: {
    isSavingOrder?: boolean;
  } = {}
) {
  return mount(PlayList, {
    props: {
      ...playlist,
      isSavingOrder: options.isSavingOrder
    },
    global: {
      mocks: {
        $t: (key: string) => `t:${key}`
      },
      stubs: {
        AppletCard: {
          name: 'AppletCard',
          props: ['applet', 'hasCallToAction'],
          template:
            '<article data-testid="applet-card">card:{{ applet.packageName }}:call-to-action:{{ hasCallToAction }}:<slot name="cta" /></article>'
        },
        AppletList: {
          name: 'AppletList',
          emits: ['reordered'],
          props: ['applets', 'classes', 'isDragable', 'isReorderPending'],
          template: `
            <section data-testid="applet-list">
              <slot
                v-for="applet in applets"
                name="item"
                v-bind="applet"
              />
            </section>
          `
        }
      }
    }
  });
}

function createPlaylist(overrides: Partial<IPlaylist> = {}): IPlaylist {
  return {
    applets: [createInstalledApplet('clock'), createInstalledApplet('weather')],
    dateCreated: new Date('2026-01-01T00:00:00.000Z'),
    dateModified: new Date('2026-01-02T00:00:00.000Z'),
    name: 'Main Playlist',
    uuid: 'playlist-uuid' as UUID,
    ...overrides
  };
}

function createInstalledApplet(packageName: string): IInstalledApplet {
  return {
    categories: [],
    defaultImage: {
      alt: packageName,
      dateCreated: new Date('2026-01-01T00:00:00.000Z'),
      src: `/${packageName}.webp`
    },
    details: {
      author: 'Pixelrunner',
      desc: `${packageName} description`,
      name: packageName,
      summary: `${packageName} summary`
    },
    fileName: `${packageName}.star`,
    installationDetails: {
      image: {
        alt: `${packageName} installed`,
        dateCreated: new Date('2026-01-02T00:00:00.000Z'),
        src: `/${packageName}-installed.webp`
      },
      uuid: `${packageName}-uuid` as UUID
    },
    isInstalled: true,
    packageName
  };
}
