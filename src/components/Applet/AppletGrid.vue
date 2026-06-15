<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppletCard from '@/components/Applet/AppletCard.vue';
import AppletList from '@/components/Applet/AppletList.vue';
import PaginationNavigation from '@/components/PaginationNavigation.vue';

import type { IFullApplet } from 'pixelrunner-shared';

interface Props {
  applets: IFullApplet[];
  pageSize?: number;
}

const { applets, pageSize = 20 }: Props = defineProps<Props>();

const page = ref(1);
const offset = computed(() => (page.value - 1) * pageSize);

// Reset to first page when the applet set changes (e.g. switching category).
watch(
  () => applets,
  () => {
    page.value = 1;
  }
);
</script>

<template>
  <div class="component--applet-grid my-4">
    <AppletList
      :applets
      :limit="pageSize"
      :offset
      :classes="{
        list: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
        item: 'grid__item block'
      }"
    >
      <template #item="applet">
        <AppletCard view="vertical" :applet />
      </template>
    </AppletList>

    <PaginationNavigation v-model:page="page" :total="applets.length" :page-size="pageSize" />
  </div>
</template>
