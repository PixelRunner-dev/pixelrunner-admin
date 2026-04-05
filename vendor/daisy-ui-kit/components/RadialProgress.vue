<script setup lang="ts">
defineProps<{
  value: number | string
  size?: string
  thickness?: string

  color?: string
  neutral?: boolean
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  info?: boolean
  success?: boolean
  warning?: boolean
  error?: boolean
}>()
</script>

<template>
  <div
    class="radial-progress"
    :class="{
      'text-neutral': neutral || color === 'neutral',
      'text-primary': primary || color === 'primary',
      'text-secondary': secondary || color === 'secondary',
      'text-accent': accent || color === 'accent',
      'text-info': info || color === 'info',
      'text-success': success || color === 'success',
      'text-warning': warning || color === 'warning',
      'text-error': error || color === 'error',
    }"
    :style="`--value:${value}; --size:${size || '4rem'}; --thickness:${thickness || 'calc(var(--size) / 10)'};`"
  >
    <slot />
  </div>
</template>
