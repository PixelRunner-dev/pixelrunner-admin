<script setup lang="ts">
import { ref } from 'vue';

import {
  Flex as DFlex,
  Input as DInput,
  Label as DLabel
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default?: string;
  palette: string[];
}

const { id, palette, default: defaultValue }: Props = defineProps<Props>();

const colorValue = ref(defaultValue || palette[0] || '#000000');
</script>

<template>
<div class="component--field-color">
  <DFlex class="relative gap-4 border border-size-field rounded-field focus-within:ring focus-within:outline-2 focus-within:outline-offset-3 bg-base-100 text-sm w-80"
    style="border-color: color-mix(in oklab, var(--color-base-content) 20%, #0000);">
    <DLabel class="w-full px-3 text-base-content" :for="id">{{ colorValue }}</DLabel>
    <DInput v-model="colorValue" :id type="color" ghost class="outline-none p-0 text-sm w-16" :list="`${id}-palette`" />
  </DFlex>
  <datalist :id="`${id}-palette`">
    <option v-for="c in palette" :key="c" :value="c">{{ c }}</option>
  </datalist>
</div>
</template>

<style scoped>
input[type="color" i]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-moz-color-swatch {
  border: 0;
}
input[type="color"]::-webkit-color-swatch {
  border: 0;
  border-radius: var(--rounded-field);
}
</style>
