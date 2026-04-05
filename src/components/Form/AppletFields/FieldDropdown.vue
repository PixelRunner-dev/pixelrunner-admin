<script setup lang="ts">
import { ref } from 'vue';

import {
  Flex as DFlex,
  Select as DSelect
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  options: { label: string; display: string }[];
  default?: string;
}

const { id, options, default: defaultValue }: Props = defineProps<Props>();

const dropdown = ref(defaultValue);
const dropdownOptions = ref<{ label: string; display: string }[]>(options.map((o) => ({ ...o, label: o.display })));
</script>

<template>
<div class="component--field-dropdown">
  <DFlex>
    <DSelect v-model="dropdown" :id :options="dropdownOptions" />
  </DFlex>
</div>
</template>
