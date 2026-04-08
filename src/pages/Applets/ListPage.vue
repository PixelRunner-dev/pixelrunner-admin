<script setup lang="ts">
import { onMounted, ref } from 'vue';

import PlayList from '@/components/PlayList.vue';
import { useWebSocket } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import type { IPlaylist } from 'pixelrunner-shared/lib/interfaces';

const activePlaylist = ref<IPlaylist>();

// Get WebSocket functionality
const { isConnected, playlists } = useWebSocket();

onMounted(async () => {
  if (isConnected.value) {
    activePlaylist.value = await playlists.activePlaylist();
  }

  // playlists.value = (await import('@/../test/mocks/playlists.json')).default;
});
</script>

<template>
  <main class="site-wrapper">
    <h1 class="text-5xl">[Your Pixelrunner]</h1>

    <!-- activeAppletIndex="0" -->
    <PlayList v-if="activePlaylist" v-bind="activePlaylist" />

    <div class="text-center m-4">
      <router-link to="/store" class="btn btn-primary btn-wide" @touchstart="() => vibrateDevice(4)" @touchend="() => vibrateDevice(1)">
        {{ $t('generic.add') }}
      </router-link>
    </div>
  </main>
</template>

<style scoped></style>
