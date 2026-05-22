<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

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

const route = useRoute();
const { isConnected, state, lastError, applets } = useClientApi();

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

const debugState = computed(() => ({
  clientState: state.value,
  isConnected: isConnected.value,
  isLoading: isLoading.value,
  hasLoadAttempted: hasLoadAttempted.value,
  loadError: loadError.value,
  lastClientError: lastError.value?.message ?? null,
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

    <p v-else-if="isLoading" class="m-4 text-center">Loading applet...</p>
    <p v-else-if="isWaitingForPeer" class="m-4 text-center">Waiting for device connection...</p>
    <p v-else-if="loadError" class="m-4 text-center text-error">{{ loadError }}</p>
    <h1 v-else class="m-4">Applet not found</h1>

    <FeatureToggle features="debug">
      <DebugSection :data="debugState" />
    </FeatureToggle>
  </main>
</template>
