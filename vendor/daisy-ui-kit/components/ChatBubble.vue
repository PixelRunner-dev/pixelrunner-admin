<script setup lang="ts">
const { color, neutral, primary, secondary, accent, info, success, warning, error } = defineProps<{
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
    class="chat-bubble"
    :class="{
      'chat-bubble-neutral': neutral || color === 'neutral',
      'chat-bubble-primary': primary || color === 'primary',
      'chat-bubble-secondary': secondary || color === 'secondary',
      'chat-bubble-accent': accent || color === 'accent',
      'chat-bubble-info': info || color === 'info',
      'chat-bubble-success': success || color === 'success',
      'chat-bubble-warning': warning || color === 'warning',
      'chat-bubble-error': error || color === 'error',
    }"
  >
    <slot />
  </div>
</template>
