<script setup lang="ts">
defineProps<{
  join?: boolean

  color?: string
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  info?: boolean
  success?: boolean
  warning?: boolean
  error?: boolean

  ghost?: boolean
  disabled?: boolean

  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()
defineEmits(['files'])
</script>

<template>
  <input
    type="file"
    :disabled="disabled"
    class="file-input"
    :class="{
      'join-item': join,

      'file-input-primary': primary || color === 'primary',
      'file-input-secondary': secondary || color === 'secondary',
      'file-input-accent': accent || color === 'accent',
      'file-input-info': info || color === 'info',
      'file-input-success': success || color === 'success',
      'file-input-warning': warning || color === 'warning',
      'file-input-error': error || color === 'error',

      'file-input-xl': xl || size === 'xl',
      'file-input-lg': lg || size === 'lg',
      'file-input-md': md || size === 'md',
      'file-input-sm': sm || size === 'sm',
      'file-input-xs': xs || size === 'xs',

      'file-input-ghost': ghost,
    }"
    @input="$emit('files', ($event.target as any).value)"
  />
</template>
