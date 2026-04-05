<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | [number, number]
    min?: number
    max?: number
    step?: number
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
const emit = defineEmits(['update:modelValue'])

const isRange = computed(() => {
  return Array.isArray(props.modelValue)
})

const singleValue = computed({
  get: () => (isRange.value ? 0 : (props.modelValue as number)),
  set: val => emit('update:modelValue', Number(val)),
})

const lowValue = computed({
  get: () => (isRange.value ? (props.modelValue as [number, number])[0] : 0),
  set: val => {
    const v = Number(val)
    const high = (props.modelValue as [number, number])[1]
    emit('update:modelValue', [Math.min(v, high), high])
  },
})

const highValue = computed({
  get: () => (isRange.value ? (props.modelValue as [number, number])[1] : 100),
  set: val => {
    const v = Number(val)
    const low = (props.modelValue as [number, number])[0]
    emit('update:modelValue', [low, Math.max(v, low)])
  },
})

const rangeClasses = computed(() => ({
  'range-neutral': props.neutral || props.color === 'neutral',
  'range-primary': props.primary || props.color === 'primary',
  'range-secondary': props.secondary || props.color === 'secondary',
  'range-accent': props.accent || props.color === 'accent',
  'range-success': props.success || props.color === 'success',
  'range-info': props.info || props.color === 'info',
  'range-warning': props.warning || props.color === 'warning',
  'range-error': props.error || props.color === 'error',
  'range-xl': props.xl || props.size === 'xl',
  'range-lg': props.lg || props.size === 'lg',
  'range-md': props.md || props.size === 'md',
  'range-sm': props.sm || props.size === 'sm',
  'range-xs': props.xs || props.size === 'xs',
}))

// Calculate percentage positions for the filled track
const lowPercent = computed(() => {
  const range = props.max - props.min
  return ((lowValue.value - props.min) / range) * 100
})

const highPercent = computed(() => {
  const range = props.max - props.min
  return ((highValue.value - props.min) / range) * 100
})
</script>

<template>
  <!-- Single value mode -->
  <input
    v-if="!isRange"
    v-model="singleValue"
    type="range"
    class="range"
    :class="rangeClasses"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
  />

  <!-- Dual handle range mode -->
  <div v-else class="range range-slider-wrapper" :class="rangeClasses">
    <div class="range-slider-track" />
    <div
      class="range-slider-fill"
      :style="{
        left: `calc(${lowPercent}% + (var(--range-thumb-size, 1.5rem) / 2) - (${lowPercent} * var(--range-thumb-size, 1.5rem) / 100))`,
        width: `calc(${highPercent - lowPercent}% - (${highPercent - lowPercent} * var(--range-thumb-size, 1.5rem) / 100))`,
      }"
    />
    <input
      v-model="lowValue"
      type="range"
      class="range range-slider-input"
      :class="rangeClasses"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
    />
    <input
      v-model="highValue"
      type="range"
      class="range range-slider-input"
      :class="rangeClasses"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
    />
  </div>
</template>

<style>
.range-slider-wrapper {
  position: relative;
  width: 100%;
  height: var(--range-thumb-size, 1.5rem);
}

.range-slider-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: calc(var(--range-thumb-size, 1.5rem) / 3);
  transform: translateY(-50%);
  background: color-mix(in oklab, currentColor 10%, transparent);
  border-radius: var(--radius-selector, 1rem);
}

.range-slider-fill {
  position: absolute;
  top: 50%;
  height: var(--range-thumb-size, 1.5rem);
  transform: translateY(-50%);
  background: currentColor;
  border-radius: 0;
  z-index: 1;
}

.range-slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: transparent;
  --range-fill: 0 !important;
}

/* Hide both tracks - we draw our own */
.range-slider-input::-webkit-slider-runnable-track {
  background: transparent !important;
  box-shadow: none !important;
}

.range-slider-input::-moz-range-track {
  background: transparent !important;
  box-shadow: none !important;
}

/* Enable pointer events only on thumbs */
.range-slider-input::-webkit-slider-thumb {
  pointer-events: auto;
  position: relative;
  z-index: 3;
}

.range-slider-input::-moz-range-thumb {
  pointer-events: auto;
  position: relative;
  z-index: 3;
}
</style>
