<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import PlayList from '@/components/PlayList.vue';
import DebugSection from '@/components/DebugSection.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';
import { useNotifications } from '@/composables/useNotifications.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';
import { vibrateDevice } from '@/utils/generic.ts';
import type { Notification } from '@/utils/notifications.ts';

import { Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

import type { IPlaylist, UUID } from 'pixelrunner-shared';
import { t } from 'i18next';

const { isConnected, state, lastError, playlists } = useClientApi();

const notificationState = useNotifications();

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
  defaultErrorMessage: t('listPage.notification.loadError'),
  onSuccess: (playlist) => {
    console.log('[ListPage] Active playlist applet count:', playlist.applets.length);

    if (!playlist.applets.length) {
      console.warn('[ListPage] Active playlist received but contains no applets');
    }
  }
});

const isSavingOrder = ref(false);
const saveOrderError = ref<string | null>(null);
const SAVE_ORDER_TIMEOUT_MS = 5000;
const NOTIFICATION_DELAY_MS = 500;

function getAppletUuid(applet: IPlaylist['applets'][number]): UUID | null {
  return applet.installationDetails?.uuid ?? null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('listPage.notification.saveOrderError');
}

async function handlePlaylistReorder(orderedApplets: IPlaylist['applets']) {
  if (!playlists || !activePlaylist.value || isSavingOrder.value) {
    return;
  }

  const appletUuids = orderedApplets.map(getAppletUuid);

  if (appletUuids.some((uuid) => !uuid)) {
    saveOrderError.value = t('listPage.notification.saveOrderUuidError');
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

  try {
    await playlists.updateOrder(appletUuids as UUID[], {
      timeout: SAVE_ORDER_TIMEOUT_MS
    });

    activePlaylist.value = {
      ...activePlaylist.value,
      dateModified: new Date()
    };
  } catch (error) {
    const caughtErrorMessage = getErrorMessage(error);

    activePlaylist.value = previousPlaylist;
    saveOrderError.value = caughtErrorMessage;
  } finally {
    isSavingOrder.value = false;
  }
}

const activeStatusNotification = computed<Notification | null>(() => {
  // if (isSavingOrder.value) {
  //   return { type: 'info', message: 'Saving playlist order...' };
  // }

  if (saveOrderError.value) {
    return { type: 'error', message: saveOrderError.value, hasCloseButton: true };
  }

  // if (isLoading.value) {
  //   return { type: 'info', message: 'Loading active playlist...' };
  // }

  // if (isWaitingForPeer.value) {
  //   return { type: 'info', message: 'Waiting for device connection...' };
  // }

  if (loadError.value) {
    return { type: 'error', message: loadError.value, hasCloseButton: true };
  }

  return null;
});

watch(
  activeStatusNotification,
  (notification, previousNotification) => {
    if (previousNotification) {
      notificationState?.setNotification(false, previousNotification);
    }

    if (!notification) return;

    notificationState?.setNotification(true, notification, {
      delay: NOTIFICATION_DELAY_MS
    });
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (activeStatusNotification.value) {
    notificationState?.setNotification(false, activeStatusNotification.value);
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
  playlistAppletCount: activePlaylist.value?.applets.length ?? 0,
  isSavingOrder,
  saveOrderError,
  isWaitingForPeer
}));
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">{{ $t('listPage.pageTitle') }}</DText>

    <PlayList
      v-if="activePlaylist"
      v-bind="activePlaylist"
      :isSavingOrder
      @reorder="handlePlaylistReorder"
    />

    <div class="text-center m-4">
      <router-link
        to="/library"
        class="btn btn-primary btn-wide"
        @touchstart="() => vibrateDevice(4)"
        @touchend="() => vibrateDevice(1)"
      >
        {{ $t('listPage.cta.goToLibrary') }}
      </router-link>
    </div>

    <FeatureToggle features="debug">
      <DebugSection :data="debugState" />
    </FeatureToggle>
  </main>
</template>

<style scoped></style>
