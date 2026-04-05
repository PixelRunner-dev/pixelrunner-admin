<script setup lang="ts">
const props = defineProps<{
  shape?: string
  squircle?: boolean
  heart?: boolean
  hexagon?: boolean
  hexagon2?: boolean
  decagon?: boolean
  pentagon?: boolean
  diamond?: boolean
  square?: boolean
  circle?: boolean
  star?: boolean
  star2?: boolean
  triangle?: boolean
  triangle2?: boolean
  triangle3?: boolean
  triangle4?: boolean
  half1?: boolean
  half2?: boolean
}>()
</script>

<template>
  <div
    class="mask"
    :class="{
      'mask-squircle': props.squircle || props.shape === 'squircle',
      'mask-heart': props.heart || props.shape === 'heart',
      'mask-hexagon': props.hexagon || props.shape === 'hexagon',
      'mask-hexagon-2': props.hexagon2 || props.shape === 'hexagon-2',
      'mask-decagon': props.decagon || props.shape === 'decagon',
      'mask-pentagon': props.pentagon || props.shape === 'pentagon',
      'mask-diamond': props.diamond || props.shape === 'diamond',
      'mask-square': props.square || props.shape === 'square',
      'mask-circle': props.circle || props.shape === 'circle',
      'mask-star': props.star || props.shape === 'star',
      'mask-star-2': props.star2 || props.shape === 'star-2',
      'mask-triangle': props.triangle || props.shape === 'triangle',
      'mask-triangle-2': props.triangle2 || props.shape === 'triangle-2',
      'mask-triangle-3': props.triangle3 || props.shape === 'triangle-3',
      'mask-triangle-4': props.triangle4 || props.shape === 'triangle-4',
      'mask-half-1': props.half1 || props.shape === 'half-1',
      'mask-half-2': props.half2 || props.shape === 'half-2',
    }"
  >
    <slot />
  </div>
</template>
