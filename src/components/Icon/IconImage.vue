<script setup lang="ts">
import type { IIconImage } from 'pixelrunner-shared;

const {
  iconId,
  alt,
  className,
  size = 16,
  isDecorative = true,
  fill = '#000',
  stroke = '#fff'
}: IIconImage = defineProps<IIconImage>();
</script>

<template>
  <svg
    :class="['component--icon', 'icon', iconId, className].join(' ')"
    :width="size"
    :height="size"
    :fill
    :stroke
    role="img"
    :aria-hidden="isDecorative"
  >
    <title v-if="alt">{{ alt }}</title>
    <use :href="`#${iconId}`" />
  </svg>
</template>
