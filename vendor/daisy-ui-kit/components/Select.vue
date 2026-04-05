<script setup lang="ts">
import { computed } from 'vue'

type Color = 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    modelValue: any
    options: Record<string, any>[] | any[]
    value?: (val: any) => any
    label?: (val: any) => any
    resultAsObject?: boolean
    join?: boolean

    ghost?: boolean
    disabled?: boolean
    validator?: boolean
    native?: boolean

    color?: Color
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean

    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    value: (val: any) => {
      if (val == null) {
        return null
      }

      return typeof val === 'string' ? (val as string) : (val?.value ?? val?.id ?? val?._id ?? val)
    },
    label: (val: any) => (typeof val === 'string' ? (val as string) : val.label || val.name || val.title),
    resultAsObject: false,
  },
)
const emit = defineEmits(['update:modelValue'])

const computedVModel = computed({
  get: () => {
    if (props.resultAsObject && props.modelValue != null) {
      return props.value(props.modelValue)
    }

    return props.modelValue
  },
  set: val => {
    if (val === undefined) {
      val = null
    }
    if (props.resultAsObject && val != null) {
      val = props.options.find(o => props.value(o) === val)
    }

    emit('update:modelValue', val)
  },
})
</script>

<template>
  <select
    v-model="computedVModel"
    class="select"
    :class="{
      'join-item': props.join,
      validator: props.validator,
      'select-ghost': props.ghost,
      'appearance-none': props.native,
      'select-neutral': props.neutral || props.color === 'neutral',
      'select-primary': props.primary || props.color === 'primary',
      'select-secondary': props.secondary || props.color === 'secondary',
      'select-accent': props.accent || props.color === 'accent',
      'select-info': props.info || props.color === 'info',
      'select-success': props.success || props.color === 'success',
      'select-warning': props.warning || props.color === 'warning',
      'select-error': props.error || props.color === 'error',
      'select-xl': props.xl || props.size === 'xl',
      'select-lg': props.lg || props.size === 'lg',
      'select-md': props.md || props.size === 'md',
      'select-sm': props.sm || props.size === 'sm',
      'select-xs': props.xs || props.size === 'xs',
    }"
    :disabled="disabled"
  >
    <option v-for="option in options" :key="value(option)" :value="value(option)" :disabled="option.disabled">
      {{ label(option) }}
    </option>
  </select>
</template>
