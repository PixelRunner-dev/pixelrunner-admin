<script setup lang="ts">
import { computed, watchEffect } from 'vue';

import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { EXPERIMENTAL_FEATURES_SETTING_KEY, type FeatureToggleKey } from '@/constants.ts';
import {
  extractControllerVersionFromStatus,
  getFeatureToggleItem,
  getFeatureToggleSettingKey,
  isFeatureSupportedByControllerVersion,
  isFeatureToggleKey,
  parseBooleanSetting
} from '@/utils/feature-toggles.ts';
import { useClientApi } from '@/ws/index.ts';
import { t } from 'i18next';

interface Props {
  features: FeatureToggleKey | FeatureToggleKey[];
}

const props = defineProps<Props>();
const { device, isConnected, lastError, settings, state } = useClientApi();

const requestedFeatureKeys = computed(() =>
  Array.isArray(props.features) ? props.features : [props.features]
);

const invalidFeatureKeys = computed(() =>
  requestedFeatureKeys.value.filter((featureKey) => !isFeatureToggleKey(featureKey))
);

const requestedFeatures = computed(() =>
  requestedFeatureKeys.value
    .map((featureKey) => getFeatureToggleItem(featureKey))
    .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))
);

watchEffect(() => {
  if (invalidFeatureKeys.value.length === 0) {
    return;
  }

  console.error('[FeatureToggle] Unknown feature key(s):', invalidFeatureKeys.value);
});

const { data: featureToggleState } = useControllerQuery({
  label: 'FeatureToggle',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(settings && device) && invalidFeatureKeys.value.length === 0,
  skipContext: () => ({
    hasSettingsApi: Boolean(settings),
    hasDeviceApi: Boolean(device),
    invalidFeatureKeys: invalidFeatureKeys.value
  }),
  load: async () => {
    if (!settings || !device) {
      return { settingsByKey: new Map<string, string>(), controllerVersion: null };
    }

    const [settingRecords, status] = await Promise.all([
      settings.getAll(),
      device.status({ full: true })
    ]);

    return {
      settingsByKey: new Map(settingRecords.map((record) => [record.key, record.value])),
      controllerVersion: extractControllerVersionFromStatus(status)
    };
  },
  defaultErrorMessage: t('featureToggleComponent.error.loadFailed')
});

const canRenderSlot = computed(() => {
  if (invalidFeatureKeys.value.length > 0 || requestedFeatures.value.length === 0) {
    return false;
  }

  const currentState = featureToggleState.value;
  if (!currentState) {
    return false;
  }

  const experimentalFeaturesEnabled = parseBooleanSetting(
    currentState.settingsByKey.get(EXPERIMENTAL_FEATURES_SETTING_KEY)
  );

  if (!experimentalFeaturesEnabled) {
    return false;
  }

  return requestedFeatures.value.every((feature) => {
    const featureSettingValue = currentState.settingsByKey.get(
      getFeatureToggleSettingKey(feature.key)
    );

    return (
      isFeatureSupportedByControllerVersion(feature, currentState.controllerVersion) &&
      parseBooleanSetting(featureSettingValue)
    );
  });
});
</script>

<template>
  <slot v-if="canRenderSlot" />
</template>
