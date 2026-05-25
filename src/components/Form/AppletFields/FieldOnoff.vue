<script setup lang="ts">
import { computed } from 'vue';

import { Toggle as DToggle } from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default: boolean;
}

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  default: {
    type: null,
    required: true
  }
}) as Readonly<Props>;
const modelValue = defineModel<boolean | undefined>({ default: undefined });
const toggle = computed({
  get: () => modelValue.value ?? props.default,
  set: (value) => {
    modelValue.value = value;
  }
});
</script>

<template>
  <div class="component--field-onoff">
    <DToggle v-model="toggle" :id="props.id" />
  </div>
</template>
