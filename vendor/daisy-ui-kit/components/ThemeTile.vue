<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  theme?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  xs?: boolean
  sm?: boolean
  md?: boolean
  lg?: boolean
  xl?: boolean
}>()
const size = computed(() => props.size ?? 'md')

const squareClass = computed(() => {
  switch (size.value) {
    case 'xs':
      return 'w-full h-full rounded-[2px]'
    case 'sm':
      return 'w-full h-full rounded-[2px]'
    case 'md':
      return 'w-full h-full rounded-xs'
    case 'lg':
      return 'w-full h-full rounded-sm'
    case 'xl':
      return 'w-full h-full rounded'
    default:
      return 'w-full h-full rounded-xs'
  }
})
</script>

<template>
  <div
    :data-theme="theme"
    class="grid grid-cols-2 bg-white rounded-sm"
    :class="{
      '!size-4 p-0.5 gap-px': xs || size === 'xs',
      '!size-5 p-0.5 gap-px': sm || size === 'sm',
      'size-6 p-0.5 gap-0.5': md || size === 'md' || !size,
      'size-8 p-0.75 gap-0.5': lg || size === 'lg',
      'size-10 h-10 p-1 gap-0.75': xl || size === 'xl',
    }"
  >
    <div class="bg-neutral" :class="squareClass" />
    <div class="bg-primary" :class="squareClass" />
    <div class="bg-secondary" :class="squareClass" />
    <div class="bg-accent" :class="squareClass" />
  </div>
</template>
