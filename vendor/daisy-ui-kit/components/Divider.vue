<script setup lang="ts">
defineProps<{
  orientation?: 'horizontal' | 'vertical'
  horizontal?: boolean
  vertical?: boolean
  align?: 'center' | 'start' | 'end'
  center?: boolean
  start?: boolean
  end?: boolean
  color?: 'neutral' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'error'
  neutral?: boolean
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  success?: boolean
  warning?: boolean
  info?: boolean
  error?: boolean
}>()
</script>

<template>
  <div
    class="divider"
    :class="{
      'divider-vertical': orientation === 'vertical' || vertical,
      'divider-horizontal': orientation !== 'vertical' || horizontal,
      'divider-neutral': color === 'neutral' || neutral,
      'divider-primary': color === 'primary' || primary,
      'divider-secondary': color === 'secondary' || secondary,
      'divider-accent': color === 'accent' || accent,
      'divider-success': color === 'success' || success,
      'divider-warning': color === 'warning' || warning,
      'divider-info': color === 'info' || info,
      'divider-error': color === 'error' || error,
      'divider-start': align === 'start' || start,
      'divider-center': align === 'center' || center,
      'divider-end': align === 'end' || end,
    }"
  >
    <slot />
  </div>
</template>
