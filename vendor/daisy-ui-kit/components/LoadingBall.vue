<script setup lang="ts">
const props = defineProps<{
  color?: string
  neutral?: boolean
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  info?: boolean
  success?: boolean
  warning?: boolean
  error?: boolean

  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()
</script>

<template>
  <span
    class="loading loading-ball"
    :class="{
      'text-primary': props.primary || props.color === 'primary',
      'text-secondary': props.secondary || props.color === 'secondary',
      'text-neutral': props.neutral || props.color === 'neutral',
      'text-accent': props.accent || props.color === 'accent',
      'text-info': props.info || props.color === 'info',
      'text-success': props.success || props.color === 'success',
      'text-warning': props.warning || props.color === 'warning',
      'text-error': props.error || props.color === 'error',

      'loading-xl': props.xl || props.size === 'xl',
      'loading-lg': props.lg || props.size === 'lg',
      'loading-md': props.md || props.size === 'md',
      'loading-sm': props.sm || props.size === 'sm',
      'loading-xs': props.xs || props.size === 'xs',
    }"
  />
</template>
