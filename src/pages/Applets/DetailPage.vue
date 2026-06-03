<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useNotifications } from '@/composables/useNotifications.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';

import AppletItem from '@/components/Applet/AppletItem.vue';
import AppletConfig from '@/components/Applet/AppletConfig.vue';
import AppletDetails from '@/components/Applet/AppletDetails.vue';
import AppletImage from '@/components/Applet/AppletImage.vue';
import CategoryList from '@/components/CategoryList.vue';
import DebugSection from '@/components/DebugSection.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';

import type { IFullApplet, UUID } from 'pixelrunner-shared';
import type { Notification } from '@/utils/notifications.ts';

const route = useRoute();
const { isConnected, state, lastError, applets } = useClientApi();
const notificationState = useNotifications();
const NOTIFICATION_DELAY_MS = 500;

function getValueOfParam(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

const packageName = computed(() => getValueOfParam(route.params.packageName));
const uuid = computed(() => getValueOfParam(route.params.uuid) as UUID | undefined);
const hasAppletIdentifier = computed(() => Boolean(packageName.value || uuid.value));
const canLoadApplet = computed(() => isConnected.value && hasAppletIdentifier.value);

const {
  data: applet,
  isLoading,
  error: loadError,
  hasAttempted: hasLoadAttempted,
  isWaitingForPeer,
  reload
} = useControllerQuery<IFullApplet | null>({
  label: 'DetailPage',
  enabled: canLoadApplet,
  state,
  lastError,
  canLoad: () => Boolean(applets && hasAppletIdentifier.value),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    packageName: packageName.value ?? null,
    uuid: uuid.value ?? null
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    if (!hasAppletIdentifier.value) {
      throw new Error('Missing applet identifier');
    }

    return applets.get(packageName.value, uuid.value);
  },
  defaultErrorMessage: 'Failed to load applet',
  onSuccess: (loadedApplet) => {
    if (!loadedApplet) {
      return;
    }

    console.log('[DetailPage] Applet loaded:', {
      packageName: loadedApplet.packageName,
      uuid: loadedApplet.installationDetails?.uuid ?? null,
      isInstalled: loadedApplet.isInstalled
    });
  }
});

watch([packageName, uuid], () => {
  if (canLoadApplet.value) {
    void reload();
  }
});

const activeStatusNotification = computed<Notification | null>(() => {
  if (isLoading.value) {
    return { type: 'info', message: 'Loading applet...' };
  }

  if (isWaitingForPeer.value) {
    return { type: 'info', message: 'Waiting for device connection...' };
  }

  if (loadError.value) {
    return { type: 'error', message: loadError.value, hasCloseButton: true };
  }

  if (hasLoadAttempted.value && !applet.value) {
    return { type: 'warning', message: 'Applet not found', hasCloseButton: true };
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
  isWaitingForPeer: isWaitingForPeer.value,
  packageName: packageName.value ?? null,
  uuid: uuid.value ?? null,
  loadedPackageName: applet.value?.packageName ?? null,
  loadedUuid: applet.value?.installationDetails?.uuid ?? null,
  applet
}));
</script>

<template>
  <main class="site-wrapper">
    <AppletItem v-if="applet" :applet>
      <template #item="applet">
        <AppletImage
          v-bind="
            applet.isInstalled && applet.installationDetails?.image
              ? applet.installationDetails?.image
              : applet.defaultImage
          "
          showFrame
        />
        <AppletDetails v-bind="applet.details" view="full-detail" />
        <CategoryList v-if="applet.categories" :categories="applet.categories" hasItemsInline />
        <AppletConfig :applet />
      </template>
    </AppletItem>

    <FeatureToggle features="debug">
      <DebugSection :data="debugState" />
    </FeatureToggle>
  </main>
</template>
