<script setup lang="ts">
import { computed, ref, nextTick, watch /* TransitionGroup */ } from 'vue';
import { useDraggable } from 'vue-draggable-plus';

import AppletItem from './AppletItem.vue';

import { vibrateDevice } from '@/utils/generic.ts';

import type { IFullApplet } from 'pixelrunner-shared';

export interface Props {
  applets: IFullApplet[];
  classes?: {
    list?: string;
    item?: string;
  };
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
  isDragable?: boolean;
  isReorderPending?: boolean;
}

const {
  applets,
  classes,
  sort,
  order,
  limit = 20,
  offset = 0,
  isDragable = false,
  isReorderPending = false
}: Props = defineProps<Props>();
const emit = defineEmits<{
  reordered: [applets: IFullApplet[]];
}>();
const hasSorting = sort && order;

const drag = ref(false);
const listElement = ref();
let dragStartOrder: string[] = [];
const pendingReorderKeys = ref<string[] | null>(null);

const visibleApplets = ref([...applets.slice(offset, offset + limit)]);
const draggableApplets = ref(visibleApplets.value.filter((applet) => !isPinned(applet)));
const pinnedApplets = computed(() => visibleApplets.value.filter(isPinned));

function getAppletKey(applet: IFullApplet): string {
  return applet.installationDetails?.uuid || applet.packageName;
}

function isPinned(applet: IFullApplet): boolean {
  return Boolean(applet.installationDetails?.isPinned);
}

function setVisibleApplets(nextApplets: IFullApplet[]) {
  visibleApplets.value = nextApplets;
  draggableApplets.value = nextApplets.filter((applet) => !isPinned(applet));
}

function areAppletOrderKeysEqual(nextApplets: IFullApplet[], expectedKeys: string[]) {
  if (nextApplets.length !== expectedKeys.length) return false;

  return nextApplets.every((applet, index) => getAppletKey(applet) === expectedKeys[index]);
}

function getVisiblePropApplets() {
  return [...applets.slice(offset, offset + limit)];
}

watch(
  () => [applets, offset, limit, isReorderPending] as const,
  () => {
    if (drag.value) return;

    const nextVisibleApplets = getVisiblePropApplets();

    if (
      isReorderPending &&
      pendingReorderKeys.value &&
      !areAppletOrderKeysEqual(nextVisibleApplets, pendingReorderKeys.value)
    ) {
      return;
    }

    setVisibleApplets(nextVisibleApplets);

    if (!isReorderPending) {
      pendingReorderKeys.value = null;
    }
  },
  { deep: true }
);

if (isDragable) {
  useDraggable(listElement, draggableApplets, {
    animation: 150,
    draggable: '.draggable-applet',
    onStart() {
      drag.value = true;
      dragStartOrder = draggableApplets.value.map(getAppletKey);
      vibrateDevice(5);
    },
    onEnd() {
      const nextOrder = draggableApplets.value.map(getAppletKey);
      const orderChanged = nextOrder.some((key, index) => key !== dragStartOrder[index]);

      if (orderChanged) {
        const orderedApplets = [...pinnedApplets.value, ...draggableApplets.value];
        pendingReorderKeys.value = orderedApplets.map(getAppletKey);
        setVisibleApplets(orderedApplets);
        emit('reordered', orderedApplets);
      }

      vibrateDevice(2);
      nextTick(() => {
        drag.value = false;
      });
    }
  });
}

/*

list item actief class toevoegen

*/
</script>

<template>
  <component v-if="!isDragable" :is="hasSorting ? 'ol' : 'ul'" :class="[classes?.list]">
    <TransitionGroup type="transition" name="fade">
      <li
        v-for="applet in visibleApplets"
        :key="applet.installationDetails?.uuid || applet.packageName"
        :class="['bg-base-200 rounded-box shadow-sm', classes?.item]"
      >
        <AppletItem :applet>
          <template #item="applet">
            <slot name="item" v-bind="applet" />
          </template>
        </AppletItem>
      </li>
    </TransitionGroup>
  </component>

  <template v-else>
    <component
      v-if="pinnedApplets.length"
      :is="hasSorting ? 'ol' : 'ul'"
      :class="['is-dragable', classes?.list]"
    >
      <li
        v-for="applet in pinnedApplets"
        :key="applet.installationDetails?.uuid || applet.packageName"
        :class="['bg-base-200 rounded-box my-2 shadow-sm is-pinned', classes?.item]"
      >
        <AppletItem :applet>
          <template #item="applet">
            <slot name="item" v-bind="applet" />
          </template>
        </AppletItem>
      </li>
    </component>

    <component
      :is="hasSorting ? 'ol' : 'ul'"
      :class="['is-dragable', classes?.list]"
      ref="listElement"
    >
      <TransitionGroup type="transition" :name="!drag ? 'fade' : undefined">
        <li
          v-for="applet in draggableApplets"
          :key="applet.installationDetails?.uuid || applet.packageName"
          :class="['bg-base-200 rounded-box my-2 shadow-sm draggable-applet', classes?.item]"
        >
          <span
            class="self-center-safe w-3 h-6 inline-block overflow-hidden text-[10px] leading-[5px] tracking-[2px] text-base-content cursor-grab drag-indicator"
          ></span>
          <AppletItem :applet>
            <template #item="applet">
              <slot name="item" v-bind="applet" />
            </template>
          </AppletItem>
        </li>
      </TransitionGroup>
    </component>
  </template>
</template>

<style scoped>
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.fade-leave-active {
  position: absolute;
}

.drag-indicator {
  content: '....';
}

li[draggable='true'] .drag-indicator {
  cursor: grabbing;
}

.drag-indicator::after {
  content: '.. .. .. ..';
}
</style>
