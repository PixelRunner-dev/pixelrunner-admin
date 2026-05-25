import { nextTick, type Ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import AppletList from '@/components/Applet/AppletList.vue';

import type { IFullApplet, UUID } from 'pixelrunner-shared';

interface DraggableOptions {
  onStart: () => void;
  onEnd: () => void;
}

let draggableModel: Ref<IFullApplet[]>;
let draggableOptions: DraggableOptions;

vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn((_element, model, options) => {
    draggableModel = model;
    draggableOptions = options;
  })
}));

vi.mock('@/utils/generic.ts', () => ({
  vibrateDevice: vi.fn()
}));

function makeApplet(packageName: string): IFullApplet {
  return {
    packageName,
    fileName: `${packageName}.star`,
    details: {
      name: packageName,
      summary: packageName,
      desc: packageName,
      author: 'Pixelrunner'
    },
    defaultImage: {
      src: `${packageName}.webp`,
      alt: packageName,
      dateCreated: new Date('2026-01-01T00:00:00.000Z')
    },
    categories: [],
    installationDetails: {
      uuid: `${packageName}-uuid` as UUID,
      image: {
        src: `${packageName}.webp`,
        alt: packageName,
        dateCreated: new Date('2026-01-01T00:00:00.000Z')
      }
    },
    isInstalled: true
  };
}

function mountList(applets: IFullApplet[]) {
  return mount(AppletList, {
    props: {
      applets,
      isDragable: true,
      isReorderPending: false
    },
    global: {
      stubs: {
        AppletItem: {
          props: ['applet'],
          template: '<div class="applet-item">{{ applet.packageName }}</div>'
        },
        TransitionGroup: false
      }
    }
  });
}

function renderedAppletOrder(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.applet-item').map((item) => item.text());
}

describe('AppletList reorder save state', () => {
  it('keeps optimistic order while save is pending and rolls back when pending ends with old order', async () => {
    const originalApplets: [IFullApplet, IFullApplet] = [makeApplet('first'), makeApplet('second')];
    const wrapper = mountList(originalApplets);

    draggableOptions.onStart();
    draggableModel.value = [originalApplets[1], originalApplets[0]];
    draggableOptions.onEnd();
    await nextTick();

    expect(renderedAppletOrder(wrapper)).toEqual(['second', 'first']);

    await wrapper.setProps({
      applets: originalApplets,
      isReorderPending: true
    });

    expect(renderedAppletOrder(wrapper)).toEqual(['second', 'first']);

    await wrapper.setProps({
      applets: originalApplets,
      isReorderPending: false
    });

    expect(renderedAppletOrder(wrapper)).toEqual(['first', 'second']);
  });

  it('keeps optimistic order when save completes with saved order', async () => {
    const originalApplets: [IFullApplet, IFullApplet] = [makeApplet('first'), makeApplet('second')];
    const savedApplets: [IFullApplet, IFullApplet] = [originalApplets[1], originalApplets[0]];
    const wrapper = mountList(originalApplets);

    draggableOptions.onStart();
    draggableModel.value = savedApplets;
    draggableOptions.onEnd();
    await nextTick();

    await wrapper.setProps({
      applets: originalApplets,
      isReorderPending: true
    });
    await wrapper.setProps({
      applets: savedApplets,
      isReorderPending: false
    });

    expect(renderedAppletOrder(wrapper)).toEqual(['second', 'first']);
  });
});
