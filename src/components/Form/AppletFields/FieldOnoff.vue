<script setup lang="ts">
import { ref } from 'vue';

import {
  Toggle as DToggle
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  default: boolean;
}

const { id, default: defaultValue }: Props = defineProps<Props>();
const toggle = ref(defaultValue);
</script>

<template>
<div class="component--field-onoff">
  <DToggle v-model="toggle" :id  />
</div>
</template>
