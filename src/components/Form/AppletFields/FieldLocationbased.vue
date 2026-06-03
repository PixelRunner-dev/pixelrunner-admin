<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import LocationSearch, {
  type LocationResult
} from '@/components/Form/SettingFields/LocationSearch.vue';
import { useClientApi } from '@/ws/index.ts';

import { Toggle as DToggle } from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default?: LocationResult;
}

const { id, default: defaultValue }: Props = defineProps<Props>();

const modelValue = defineModel<LocationResult>();

const { settings } = useClientApi();
const useDeviceLocation = ref(false);
const emptyLocation: LocationResult = { lat: '', lng: '' };

const location = computed({
  get: () => modelValue.value ?? defaultValue ?? emptyLocation,
  set: (value) => {
    modelValue.value = value;
  }
});

watch(useDeviceLocation, async (enabled) => {
  if (!enabled || !settings) return;
  try {
    const allSettings = await settings.getAll();
    const locationSetting = allSettings.find((s) => s.key === 'location');
    if (locationSetting?.value) {
      modelValue.value = JSON.parse(locationSetting.value) as LocationResult;
    }
  } catch {
    // ignore parse/API errors — keep existing value
  }
});
</script>

<template>
  <div class="component--field-locationbased">
    <label class="flex items-center gap-2 mb-2 text-sm cursor-pointer">
      <DToggle v-model="useDeviceLocation" :id="`${id}-use-device`" />
      <span data-testid="use-device-location-label">[Use device location]</span>
    </label>
    <LocationSearch v-if="!useDeviceLocation" :id v-model="location" :default="defaultValue" />
  </div>
</template>
