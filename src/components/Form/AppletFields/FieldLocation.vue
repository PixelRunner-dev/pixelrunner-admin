<script setup lang="ts">
import { computed } from 'vue';

import LocationSearch, {
  type LocationResult
} from '@/components/Form/SettingFields/LocationSearch.vue';

interface Props {
  id: string;
  default?: LocationResult;
}

const { id, default: defaultValue }: Props = defineProps<Props>();

const modelValue = defineModel<LocationResult>();
const emptyLocation: LocationResult = { lat: '', lng: '' };
const location = computed({
  get: () => modelValue.value ?? defaultValue ?? emptyLocation,
  set: (value) => {
    modelValue.value = value;
  }
});
</script>

<template>
  <div class="component--field-location">
    <LocationSearch :id v-model="location" :default="defaultValue" />
  </div>
</template>
