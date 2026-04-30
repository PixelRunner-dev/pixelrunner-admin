<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import PlayList from '@/components/PlayList.vue';
import { useClientApi } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import type { IPlaylist } from 'pixelrunner-shared';

const activePlaylist = ref<IPlaylist>();
const isLoading = ref(false);
const loadError = ref<string | null>(null);

const { isConnected, playlists } = useClientApi();

async function loadActivePlaylist() {
  if (!playlists || !isConnected.value || isLoading.value) {
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    activePlaylist.value = await playlists.activePlaylist();
  } catch (error) {
    activePlaylist.value = undefined;
    loadError.value = error instanceof Error ? error.message : 'Failed to load active playlist';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadActivePlaylist();
});

watch(isConnected, (connected) => {
  if (connected && !activePlaylist.value) {
    void loadActivePlaylist();
  }
}, { immediate: true });
</script>

<template>
  <main class="site-wrapper">
    <h1 class="text-5xl">[Your Pixelrunner]</h1>

    <PlayList v-if="activePlaylist" v-bind="activePlaylist" />
    <p v-else-if="isLoading" class="m-4 text-center">Loading active playlist...</p>
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
