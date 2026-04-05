<script setup lang="ts">
const {
  value = 0,
  max = 100,
  color,
  neutral,
  primary,
  secondary,
  accent,
  success,
  info,
  warning,
  error,
} = defineProps<{
  value?: string | number
  max?: string | number

  color?: string
  neutral?: boolean
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  success?: boolean
  info?: boolean
  warning?: boolean
  error?: boolean
}>()
</script>

<template>
  <progress
    :value="value"
    :max="max"
    class="progress"
    :class="{
      'progress-neutral': neutral || color === 'neutral',
      'progress-primary': primary || color === 'primary',
      'progress-secondary': secondary || color === 'secondary',
      'progress-accent': accent || color === 'accent',
      'progress-success': success || color === 'success',
      'progress-info': info || color === 'info',
      'progress-warning': warning || color === 'warning',
      'progress-error': error || color === 'error',
    }"
  />
</template>
