<script setup lang="ts">
const props = defineProps<{
  align?: 'vertical' | 'horizontal'
  vertical?: boolean
  horizontal?: boolean
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()
</script>

<template>
  <ul
    class="menu"
    :class="{
      'menu-vertical': props.vertical || props.align === 'vertical',
      'menu-horizontal': props.horizontal || props.align === 'horizontal',
      'menu-xl': props.xl || props.size === 'xl',
      'menu-lg': props.lg || props.size === 'lg',
      'menu-md': props.md || props.size === 'md',
      'menu-sm': props.sm || props.size === 'sm',
      'menu-xs': props.xs || props.size === 'xs',
    }"
  >
    <slot />
  </ul>
</template>
