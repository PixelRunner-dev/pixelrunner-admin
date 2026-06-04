<script setup lang="ts">
import AppletList from './Applet/AppletList.vue';
import AppletCard from './Applet/AppletCard.vue';

import type { IFullApplet, IPlaylist } from 'pixelrunner-shared';

interface Props extends IPlaylist {
  isSavingOrder?: boolean;
}

const { applets, dateCreated, dateModified, isSavingOrder = false }: Props = defineProps<Props>();
const emit = defineEmits<{
  reorder: [applets: IPlaylist['applets']];
}>();

function handleReordered(orderedApplets: IFullApplet[]) {
  emit('reorder', orderedApplets as IPlaylist['applets']);
}
</script>

<template>
  <div class="component--playlist my-4" :data-created="dateCreated" :data-modified="dateModified">
    <AppletList
      v-if="applets.length"
      :applets
      :limit="99"
      :isDragable="true"
      :isReorderPending="isSavingOrder"
      :classes="{ list: 'playlist list', item: 'playlist__item list-row my-2' }"
      @reordered="handleReordered"
    >
      <template #item="applet">
        <AppletCard :applet :hasCallToAction="true">
          <template #cta>{{ $t('generic.configure') }}</template>
        </AppletCard>
      </template>
    </AppletList>

    <div v-else class="bg-base-200 rounded-box my-4 p-4 shadow-sm">
      <p>{{ $t('listPage.playlist.noAppletsInPlaylist') }}</p>
    </div>
  </div>
</template>
