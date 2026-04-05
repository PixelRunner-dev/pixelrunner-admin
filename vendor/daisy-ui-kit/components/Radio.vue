<script setup lang="ts">
import { computed, inject } from 'vue'

const props = defineProps<{
  modelValue?: any
  value: any
  disabled?: boolean
  themeController?: boolean

  color?: string
  neutral?: boolean
  primary?: boolean
  secondary?: boolean
  accent?: boolean
  success?: boolean
  warning?: boolean
  info?: boolean
  error?: boolean

  size?: string
  xs?: boolean
  sm?: boolean
  md?: boolean
  lg?: boolean
  xl?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const radioGroup: any = inject('radio-group', null)

const currentValue = computed({
  get() {
    return radioGroup ? radioGroup.currentValue : props.modelValue
  },
  set(val: any) {
    if (radioGroup) {
      radioGroup.currentValue = val
    }
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <input
    v-model="currentValue"
    type="radio"
    v-bind="$attrs"
    class="radio"
    :class="{
      'radio-neutral': props.neutral || props.color === 'neutral',
      'radio-primary': props.primary || props.color === 'primary',
      'radio-secondary': props.secondary || props.color === 'secondary',
      'radio-accent': props.accent || props.color === 'accent',
      'radio-success': props.success || props.color === 'success',
      'radio-warning': props.warning || props.color === 'warning',
      'radio-info': props.info || props.color === 'info',
      'radio-error': props.error || props.color === 'error',
      'radio-xs': props.xs || props.size === 'xs',
      'radio-sm': props.sm || props.size === 'sm',
      'radio-md': props.md || props.size === 'md',
      'radio-lg': props.lg || props.size === 'lg',
      'radio-xl': props.xl || props.size === 'xl',
      'theme-controller': props.themeController,
    }"
    :disabled="props.disabled"
    :value="props.value"
  />
</template>
