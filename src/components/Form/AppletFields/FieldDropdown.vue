<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  Flex as DFlex,
  Select as DSelect
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  options: { label?: string; display: string; value?: string | number | boolean | object }[];
  default?: string | number | boolean | object;
}

const { id, options, default: defaultValue }: Props = defineProps<Props>();

const modelValue = defineModel<string | number | boolean | object | null>();
const dropdownOptions = ref(
  options.map((option) => ({
    ...option,
    label: option.display
  }))
);
const dropdown = computed({
  get: () => modelValue.value ?? defaultValue ?? null,
  set: (value) => {
    modelValue.value = value;
  }
});
</script>

<template>
<div class="component--field-dropdown">
  <DFlex>
    <DSelect v-model="dropdown" :id :options="dropdownOptions" />
  </DFlex>
</div>
</template>
