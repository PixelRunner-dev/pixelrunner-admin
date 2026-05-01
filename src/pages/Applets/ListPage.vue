<script setup lang="ts">
import { computed } from 'vue';

import PlayList from '@/components/PlayList.vue';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import type { IPlaylist } from 'pixelrunner-shared';

const { isConnected, state, lastError, playlists } = useClientApi();

const {
  data: activePlaylist,
  isLoading,
  error: loadError,
  hasAttempted: hasLoadAttempted,
  isWaitingForPeer
} = useControllerQuery<IPlaylist>({
  label: 'ListPage',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(playlists),
  skipContext: () => ({ hasPlaylistsApi: Boolean(playlists) }),
  load: async () => {
    if (!playlists) {
      throw new Error('Playlists API not available');
    }

    return playlists.activePlaylist();
  },
  defaultErrorMessage: 'Failed to load active playlist',
  onSuccess: (playlist) => {
    console.log('[ListPage] Active playlist applet count:', playlist.applets.length);

    if (!playlist.applets.length) {
      console.warn('[ListPage] Active playlist received but contains no applets');
    }
  }
});

const debugState = computed(() => ({
  clientState: state.value,
  isConnected: isConnected.value,
  isLoading: isLoading.value,
  hasLoadAttempted: hasLoadAttempted.value,
  loadError: loadError.value,
  lastClientError: lastError.value?.message ?? null,
  playlistName: activePlaylist.value?.name ?? null,
  playlistAppletCount: activePlaylist.value?.applets.length ?? 0
}));
</script>

<template>
  <main class="site-wrapper">
    <h1 class="text-5xl">[Your Pixelrunner]</h1>

    <PlayList v-if="activePlaylist" v-bind="activePlaylist" />
    <p v-else-if="isLoading" class="m-4 text-center">Loading active playlist...</p>
    <p v-else-if="isWaitingForPeer" class="m-4 text-center">Waiting for device connection...</p>
    <p v-else-if="loadError" class="m-4 text-center text-error">{{ loadError }}</p>
    <p v-else class="m-4 text-center">No active playlist available.</p>

    <section class="debug-panel m-4 p-3 rounded-box bg-base-200 text-xs font-mono">
      <h2 class="mb-2 text-sm font-bold">Connection Debug</h2>
      <p>clientState: {{ debugState.clientState }}</p>
      <p>isConnected: {{ debugState.isConnected }}</p>
      <p>isLoading: {{ debugState.isLoading }}</p>
      <p>hasLoadAttempted: {{ debugState.hasLoadAttempted }}</p>
      <p>loadError: {{ debugState.loadError ?? 'null' }}</p>
      <p>lastClientError: {{ debugState.lastClientError ?? 'null' }}</p>
      <p>playlistName: {{ debugState.playlistName ?? 'null' }}</p>
      <p>playlistAppletCount: {{ debugState.playlistAppletCount }}</p>
    </section>

    <div class="text-center m-4">
      <router-link
        to="/store"
        class="btn btn-primary btn-wide"
        @touchstart="() => vibrateDevice(4)"
        @touchend="() => vibrateDevice(1)"
      >
        {{ $t('generic.add') }}
      </router-link>
    </div>
  </main>
</template>

<style scoped></style>
