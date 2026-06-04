<script setup lang="ts">
import type { IIconImage } from 'pixelrunner-shared';

const {
  iconId,
  alt,
  className,
  fill,
  stroke,
  size = 24,
  isDecorative = false
}: IIconImage = defineProps<IIconImage>();
</script>

<template>
  <svg
    :class="['component--icon', 'icon', `icon--${iconId}`, className].join(' ')"
    :width="size"
    :height="size"
    :fill
    :stroke
    role="img"
    :aria-hidden="isDecorative"
  >
    <title v-if="alt">{{ alt }}</title>
    <use :href="`#icon--${iconId}`" />
  </svg>
</template>
