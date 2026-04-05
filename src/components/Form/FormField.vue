<script setup lang="ts">
import { toCamelCase } from '@/utils/generic.ts';

import {
  FormControl as DFormControl,
  Label as DLabel,
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  id: string;
  label?: string;
  description?: string;
  context?: string;
  showDescription?: boolean;
}

const { id, label, description, context = 'global', showDescription = false }: Props = defineProps<Props>();
</script>

<template>
  <DFormControl class="component--form-field my-4 gap-1">
    <DLabel :for="id">
      <DText size="sm">{{ label || $t(`${context}.${toCamelCase(id)}.label`) }}</DText>
    </DLabel>
    <slot />
    <DText
      v-if="description?.length || showDescription"
      is="p"
      size="xs"
      :id="`${id}-description`">
      {{ description || $t(`${context}.${toCamelCase(id)}.description`) }}
    </DText>
  </DFormControl>
</template>
