<script setup lang="ts">
defineProps<{
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()
</script>

<template>
  <kbd
    class="kbd"
    :class="{
      'kbd-xl': xl || size === 'xl',
      'kbd-lg': lg || size === 'lg',
      'kbd-md': md || size === 'md',
      'kbd-sm': sm || size === 'sm',
      'kbd-xs': xs || size === 'xs',
    }"
  >
    <slot />
  </kbd>
</template>
