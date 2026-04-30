<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import PlayList from '@/components/PlayList.vue';
import { useClientApi } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import type { IPlaylist } from 'pixelrunner-shared';

const activePlaylist = ref<IPlaylist>();
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const hasLoadAttempted = ref(false);

const { isConnected, state, lastError, playlists } = useClientApi();
const isWaitingForPeer = computed(() => (
  !activePlaylist.value &&
  !isLoading.value &&
  !loadError.value &&
  (state.value === 'connecting' || state.value === 'reconnecting' || !hasLoadAttempted.value)
));

async function loadActivePlaylist() {
  if (!playlists || !isConnected.value || isLoading.value) {
    console.log('[ListPage] Skipping active playlist load', {
      hasPlaylistsApi: Boolean(playlists),
      isConnected: isConnected.value,
      isLoading: isLoading.value
    });
    return;
  }

  isLoading.value = true;
  loadError.value = null;
  hasLoadAttempted.value = true;
  console.log('[ListPage] Requesting active playlist');

  try {
    const playlist = await playlists.activePlaylist();
    console.log('[ListPage] Active playlist response:', playlist);
    console.log('[ListPage] Active playlist applet count:', playlist.applets.length);
    activePlaylist.value = playlist;

    if (!playlist.applets.length) {
      console.warn('[ListPage] Active playlist received but contains no applets');
    }
  } catch (error) {
    activePlaylist.value = undefined;
    loadError.value = error instanceof Error ? error.message : 'Failed to load active playlist';
    console.error('[ListPage] Failed to load active playlist:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadActivePlaylist();
});

watch(isConnected, (connected) => {
  console.log('[ListPage] Connection state changed:', connected);
  if (connected && !activePlaylist.value) {
    void loadActivePlaylist();
  }
}, { immediate: true });

watch(state, (nextState) => {
  console.log('[ListPage] Client state changed:', nextState, {
    isConnected: isConnected.value,
    lastError: lastError.value?.message ?? null
  });
});

watch(lastError, (error) => {
  if (!error) return;
  console.error('[ListPage] Client error observed:', error);
});
</script>

<template>
  <main class="site-wrapper">
    <h1 class="text-5xl">[Your Pixelrunner]</h1>

    <PlayList v-if="activePlaylist" v-bind="activePlaylist" />
    <p v-else-if="isLoading" class="m-4 text-center">Loading active playlist...</p>
    <p v-else-if="isWaitingForPeer" class="m-4 text-center">Waiting for device connection...</p>
    <p v-else-if="loadError" class="m-4 text-center text-error">{{ loadError }}</p>
    <p v-else class="m-4 text-center">No active playlist available.</p>

    <div class="text-center m-4">
      <router-link to="/store" class="btn btn-primary btn-wide" @touchstart="() => vibrateDevice(4)" @touchend="() => vibrateDevice(1)">
        {{ $t('generic.add') }}
      </router-link>
    </div>
  </main>
</template>

<style scoped></style>
