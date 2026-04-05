<script setup lang="ts">
import { computed } from 'vue'
import RangeMeasureTick from './RangeMeasureTick.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | string
    min?: number | string
    max?: number | string
    step?: number | string

    numbered?: boolean
    asButtons?: boolean
    disabled?: boolean

    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    success?: boolean
    warning?: boolean
    info?: boolean
    error?: boolean

    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
  },
)
defineEmits(['update:modelValue'])

const values = computed(() => {
  const vals = []
  for (let index = Number.parseInt(props.min as string); index < Number.parseInt(props.max as string) + 1; index++) {
    vals.push({
      value: index,
      isVisible: index % Number.parseInt(props.step as string) === 0,
    })
  }
  return vals
})
// const count = computed(() => Number.parseInt(props.max as string) - Number.parseInt(props.min as string))
</script>

<template>
  <div
    class="flex justify-between select-none"
    :class="{
      'text-neutral': neutral || color === 'neutral',
      'text-primary': primary || color === 'primary',
      'text-secondary': secondary || color === 'secondary',
      'text-accent': accent || color === 'accent',
      'text-success': success || color === 'success',
      'text-info': info || color === 'info',
      'text-warning': warning || color === 'warning',
      'text-error': error || color === 'error',
      'text-xl': xl || size === 'xl',
      'text-lg': lg || size === 'lg',
      'text-md': md || size === 'md',
      'text-sm': sm || size === 'sm',
      'text-xs': xs || size === 'xs',
      'opacity-50': disabled,
    }"
  >
    <RangeMeasureTick
      v-for="tick in values"
      :key="tick.value"
      :tick="tick.value"
      :model-value="modelValue"
      :numbered="numbered"
      :as-button="asButtons"
      :is-hidden="!tick.isVisible"
      :disabled="disabled"
      @update:model-value="(val: number) => !disabled && $emit('update:modelValue', val)"
    >
      {{ numbered ? tick : '|' }}
    </RangeMeasureTick>
  </div>
</template>
