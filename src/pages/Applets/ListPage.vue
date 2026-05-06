<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue';

import PlayList from '@/components/PlayList.vue';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';

import {
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';

import type { IPlaylist, UUID } from 'pixelrunner-shared';

const PLAYLIST_ORDER_SAVE_TIMEOUT_MS = 5000;

const { isConnected, state, lastError, playlists } = useClientApi();
interface Notification {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timeoutToClose?: number;
  hasCloseButton?: boolean;
}

const notifications = inject<Ref<Notification[]>>('notifications');

const {
  data: activePlaylist,
  isLoading,
  error: loadError,
  hasAttempted: hasLoadAttempted,
  isWaitingForPeer,
  reload
} = useControllerQuery<IPlaylist>({
  label: 'ListPage',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(playlists),
  skipContext: () => ({
    hasPlaylistsApi: Boolean(playlists)
  }),
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

const isSavingOrder = ref(false);
const saveOrderError = ref<string | null>(null);
let saveOrderRequestId = 0;

function pushNotification(notification: Notification) {
  if (!notifications) {
    return;
  }

  notifications.value = [
    notification,
    ...notifications.value.filter((item) => item.message !== notification.message)
  ];
}

function getAppletUuid(applet: IPlaylist['applets'][number]): UUID | null {
  return applet.installationDetails?.uuid ?? null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to save playlist order';
}

async function waitForRollbackWindow(startedAt: number): Promise<void> {
  const elapsedMs = Date.now() - startedAt;
  const remainingMs = Math.max(0, PLAYLIST_ORDER_SAVE_TIMEOUT_MS - elapsedMs);

  if (remainingMs > 0) {
    await wait(remainingMs);
  }
}

async function handlePlaylistReorder(orderedApplets: IPlaylist['applets']) {
  if (!playlists || !activePlaylist.value || isSavingOrder.value) {
    return;
  }

  const appletUuids = orderedApplets.map(getAppletUuid);

  if (appletUuids.some((uuid) => !uuid)) {
    saveOrderError.value = 'Cannot save playlist order: one or more applets are missing an installation UUID.';
    await reload();
    return;
  }

  const previousPlaylist = activePlaylist.value;
  activePlaylist.value = {
    ...previousPlaylist,
    applets: orderedApplets
  };

  isSavingOrder.value = true;
  saveOrderError.value = null;
  const requestId = ++saveOrderRequestId;
  const saveStartedAt = Date.now();
  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, PLAYLIST_ORDER_SAVE_TIMEOUT_MS);

  try {
    await playlists.updateOrder(appletUuids as UUID[], {
      signal: abortController.signal,
      timeout: PLAYLIST_ORDER_SAVE_TIMEOUT_MS
    });

    if (requestId !== saveOrderRequestId) {
      return;
    }

    activePlaylist.value = {
      ...activePlaylist.value,
      dateModified: new Date()
    };
  } catch (error) {
    if (requestId !== saveOrderRequestId) {
      return;
    }

    const caughtErrorMessage = getErrorMessage(error);
    const rollbackBecauseTimeout =
      abortController.signal.aborted || caughtErrorMessage.toLowerCase().includes('timeout');
    const errorMessage = abortController.signal.aborted
      ? 'Saving playlist order timed out after 5 seconds'
      : caughtErrorMessage;

    await waitForRollbackWindow(saveStartedAt);

    if (requestId !== saveOrderRequestId) {
      return;
    }

    activePlaylist.value = previousPlaylist;
    saveOrderError.value = errorMessage;
    pushNotification({
      type: 'error',
      message: `[Could not save playlist order. ${saveOrderError.value}]`,
      hasCloseButton: true
    });

    if (!rollbackBecauseTimeout) {
      await reload();
    }
  } finally {
    clearTimeout(timeout);

    if (requestId === saveOrderRequestId) {
      isSavingOrder.value = false;
    }
  }
}

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
    <DText size="5xl" class="my-4">[Your Pixelrunner]</DText>

    <PlayList v-if="activePlaylist" v-bind="activePlaylist" @reorder="handlePlaylistReorder" />
    <p v-if="isSavingOrder" class="m-4 text-center text-sm">Saving playlist order...</p>
    <p v-else-if="saveOrderError" class="m-4 text-center text-sm text-error">{{ saveOrderError }}</p>
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
