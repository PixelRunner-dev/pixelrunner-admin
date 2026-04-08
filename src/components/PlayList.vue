<script setup lang="ts">
import AppletList from './Applet/AppletList.vue';
import AppletCard from './Applet/AppletCard.vue';

import type { IPlaylist } from 'pixelrunner-shared/lib/interfaces';

const { applets, dateCreated, dateModified }: IPlaylist = defineProps<IPlaylist>();
</script>

<template>
  <div class="component--playlist" :data-created="dateCreated" :data-modified="dateModified">
    <template v-if="applets.length">
      <AppletList :applets :isDragable="true" :classes="{ list: 'playlist list', item: 'playlist__item list-row' }">
        <template #item="applet">
          <AppletCard :applet :hasCallToAction="true">
            <template #cta>[Configureer]</template>
          </AppletCard>
        </template>
      </AppletList>
    </template>
    <template v-else> [Add applets from the Store to start] </template>
  </div>
</template>
