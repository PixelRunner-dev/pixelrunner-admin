<script setup lang="ts">
import { computed } from 'vue';

import {
  Toggle as DToggle
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default: boolean;
}

const { id, default: defaultValue }: Props = defineProps<Props>();
const modelValue = defineModel<boolean>();
const toggle = computed({
  get: () => modelValue.value ?? defaultValue,
  set: (value) => {
    modelValue.value = value;
  }
});
</script>

<template>
<div class="component--field-onoff">
  <DToggle v-model="toggle" :id  />
</div>
</template>
