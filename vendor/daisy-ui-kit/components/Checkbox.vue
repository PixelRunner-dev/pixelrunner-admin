<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: any
  themeController?: boolean

  color?: string
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  success?: boolean
  warning?: boolean
  info?: boolean
  error?: boolean

  size?: string
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const currentValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})
</script>

<template>
  <input
    v-model="currentValue"
    type="checkbox"
    class="checkbox"
    :class="{
      'checkbox-primary': primary || color === 'primary',
      'checkbox-secondary': secondary || color === 'secondary',
      'checkbox-accent': accent || color === 'accent',
      'checkbox-success': success || color === 'success',
      'checkbox-warning': warning || color === 'warning',
      'checkbox-info': info || color === 'info',
      'checkbox-error': error || color === 'error',
      'checkbox-xs': xs || size === 'xs',
      'checkbox-sm': sm || size === 'sm',
      'checkbox-md': md || size === 'md',
      'checkbox-lg': lg || size === 'lg',
      'theme-controller': themeController,
    }"
  />
</template>
