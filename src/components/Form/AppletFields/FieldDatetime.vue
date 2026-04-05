<script setup lang="ts">
import { ref } from 'vue';

import {
  Flex as DFlex,
  Input as DInput
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default?: string;
}

const { id, default: defaultValue }: Props = defineProps<Props>();
const toDatetimeLocal = (isoString: string): string => {
  return isoString.replace('Z', '').slice(0, 16);
};

const dateTimeLocal = ref(toDatetimeLocal(defaultValue || ''));
</script>

<template>
<div class="component--field-datetime">
  <DFlex>
    <DInput v-model="dateTimeLocal" :id type="datetime-local" />
  </DFlex>
</div>
</template>
