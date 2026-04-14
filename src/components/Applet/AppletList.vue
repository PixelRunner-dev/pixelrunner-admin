<script setup lang="ts">
import { ref, nextTick, /* TransitionGroup */ } from 'vue';
import { useDraggable } from 'vue-draggable-plus';

import AppletItem from './AppletItem.vue';

import { vibrateDevice } from '@/utils/generic.ts';

import type { IFullApplet } from 'pixelrunner-shared;

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
}

const { applets, classes, sort, order, limit = 20, offset = 0, isDragable = false }: Props = defineProps<Props>();
const hasSorting = sort && order;

const drag = ref(false);
const listElement = ref();

const sortableApplets = ref([...applets.slice(offset, offset + limit)]);

if (isDragable) {
  useDraggable(listElement, sortableApplets, {
    animation: 150,
    onStart() {
      drag.value = true;
      vibrateDevice(5);
    },
    onEnd() {
      console.log('onEnd');
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
  <component
    :is="hasSorting ? 'ol' : 'ul'"
    :class="[{ 'is-dragable': isDragable }, classes?.list]"
    ref="listElement">
    <TransitionGroup type="transition" :name="!drag ? 'fade' : undefined">
      <li
        v-for="applet in sortableApplets"
        :key="applet.installationDetails?.uuid || applet.packageName"
        :class="['bg-base-200 rounded-box my-2 shadow-sm', classes?.item]"
      >
        <template v-if="isDragable">
          <span class="self-center-safe w-3 h-6 inline-block overflow-hidden text-[10px] leading-[5px] tracking-[2px] text-base-content cursor-grab drag-indicator"></span>
        </template>
        <AppletItem :applet>
          <template #item="applet">
            <slot name="item" v-bind="applet" />
          </template>
        </AppletItem>
      </li>
    </TransitionGroup>
  </component>
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

li[draggable=true] .drag-indicator {
  cursor: grabbing;
}

.drag-indicator::after {
  content: '.. .. .. ..';
}
</style>
