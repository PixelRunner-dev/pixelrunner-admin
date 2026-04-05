<script setup lang="ts">
const props = defineProps<{
  outline?: boolean
  dash?: boolean
  soft?: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
  info?: boolean
  success?: boolean
  warning?: boolean
  error?: boolean
  orientation?: 'vertical' | 'horizontal'
  vertical?: boolean
  horizontal?: boolean
}>()
</script>

<template>
  <div
    class="alert"
    :class="{
      'alert-outline': props.outline,
      'alert-dash': props.dash,
      'alert-soft': props.soft,

      'alert-info': props.info || props.type === 'info',
      'alert-success': props.success || props.type === 'success',
      'alert-warning': props.warning || props.type === 'warning',
      'alert-error': props.error || props.type === 'error',

      'alert-vertical': props.vertical || props.orientation === 'vertical',
      'alert-horizontal': props.horizontal || props.orientation === 'horizontal',
    }"
  >
    <slot />
  </div>
</template>
