<script setup lang="ts">
import AppletCard from '@/components/Applet/AppletCard.vue';
import AppletList from '@/components/Applet/AppletList.vue';

import type { IFullApplet } from 'pixelrunner-shared';

interface Props {
  applets: IFullApplet[];
}

const { applets }: Props = defineProps<Props>();
</script>

<template>
  <div class="component--applet-grid my-4">
    <AppletList
      :applets
      :classes="{
        list: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
        item: 'grid__item block'
      }"
    >
      <template #item="applet">
        <AppletCard view="vertical" :applet />
      </template>
    </AppletList>
  </div>
</template>
