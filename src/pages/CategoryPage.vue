<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { IFullApplet } from 'pixelrunner-shared';

import DebugSection from '@/components/DebugSection.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';
import AppletGrid from '@/components/Applet/AppletGrid.vue';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';

import { Button as DButton, Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

const route = useRoute();
const { isConnected, applets, state, lastError } = useClientApi();

const categoryKey = computed(() => {
  const routeCategoryKey = route.params.categoryKey;

  return Array.isArray(routeCategoryKey) ? routeCategoryKey[0] : routeCategoryKey;
});

const {
  data: categoryApplets,
  isLoading,
  error,
  isWaitingForPeer,
  reload
} = useControllerQuery<IFullApplet[]>({
  label: 'CategoryPage',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets && categoryKey.value),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: categoryKey.value
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    if (!categoryKey.value) {
      throw new Error('Missing category key');
    }

    const loadedApplets = await applets.getAppletsByCategoryKey(categoryKey.value);

    return (loadedApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load category applets',
  onSuccess: (loadedApplets) => {
    console.log('[CategoryPage] Category applets loaded:', {
      categoryKey: categoryKey.value,
      count: loadedApplets.length
    });
  }
});

watch(categoryKey, () => {
  categoryApplets.value = undefined;
  void reload();
});
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">
      {{
        $t('categoryPage.pageTitle', {
          category: $t(`applet.category.${categoryKey}.label`)
        })
      }}
    </DText>

    <AppletGrid v-if="categoryApplets" :applets="categoryApplets" />

    <p v-else-if="isLoading" class="m-4 text-center">Loading category applets...</p>
    <p v-else-if="isWaitingForPeer" class="m-4 text-center">Waiting for device connection...</p>
    <div v-else-if="error" class="m-4 text-center">
      <p class="text-error">{{ error }}</p>
      <DButton size="xs" color="neutral" @click="reload">Retry</DButton>
    </div>

    <FeatureToggle features="debug">
      <DebugSection
        :data="{
          categoryKey,
          appletCount: categoryApplets?.length ?? 0,
          isLoading,
          error,
          isWaitingForPeer,
          clientState: state,
          isConnected
        }"
      />
    </FeatureToggle>
  </main>
</template>
