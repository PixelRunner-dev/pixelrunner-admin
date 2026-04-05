<script setup lang="ts">
defineProps<{
  color?: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
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
  <hr
    class="timeline-line"
    :class="{
      'bg-neutral': neutral || color === 'neutral',
      'bg-primary': primary || color === 'primary',
      'bg-secondary': secondary || color === 'secondary',
      'bg-accent': accent || color === 'accent',
      'bg-info': info || color === 'info',
      'bg-success': success || color === 'success',
      'bg-warning': warning || color === 'warning',
      'bg-error': error || color === 'error',
    }"
  />
</template>
