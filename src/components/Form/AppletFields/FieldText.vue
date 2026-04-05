<script setup lang="ts">
import { ref } from 'vue';

import {
  Flex as DFlex,
  Input as DInput
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  id: string;
  default?: string;
}

const { id, default: defaultValue }: Props = defineProps<Props>();
const input = ref(defaultValue);
</script>

<template>
<div class="component--field-text">
  <DFlex>
    <DInput v-model="input" :id type="text" />
  </DFlex>
</div>
</template>
