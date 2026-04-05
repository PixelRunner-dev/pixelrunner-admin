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

  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  xs?: boolean
  sm?: boolean
  md?: boolean
  lg?: boolean
  xl?: boolean
}>()
</script>

<template>
  <span
    class="status"
    :class="[
      neutral || color === 'neutral' ? 'status-neutral' : '',
      primary || color === 'primary' ? 'status-primary' : '',
      secondary || color === 'secondary' ? 'status-secondary' : '',
      accent || color === 'accent' ? 'status-accent' : '',
      info || color === 'info' ? 'status-info' : '',
      success || color === 'success' ? 'status-success' : '',
      warning || color === 'warning' ? 'status-warning' : '',
      error || color === 'error' ? 'status-error' : '',
      xs || size === 'xs' ? 'status-xs' : '',
      sm || size === 'sm' ? 'status-sm' : '',
      md || size === 'md' || (!xs && !sm && !lg && !xl && !size) ? 'status-md' : '',
      lg || size === 'lg' ? 'status-lg' : '',
      xl || size === 'xl' ? 'status-xl' : '',
    ]"
  >
    <slot />
  </span>
</template>
