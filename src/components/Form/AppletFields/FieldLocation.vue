<script setup lang="ts">
import { ref } from 'vue';

import LocationSearch, { type LocationResult } from '@/components/Form/SettingFields/LocationSearch.vue';

interface Props {
  id: string;
  default?: LocationResult;
}

const { id, default: defaultValue }: Props = defineProps<Props>();

const location = ref();
</script>

<template>
<div class="component--field-location">
  <LocationSearch :id v-model="location" :default="defaultValue" />
</div>
</template>
