<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number | string
    count?: number | string
    half?: boolean

    disabled?: boolean

    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean

    bg?: string

    shape?: string
    squircle?: boolean
    heart?: boolean
    hexagon?: boolean
    hexagon2?: boolean
    decagon?: boolean
    pentagon?: boolean
    diamond?: boolean
    square?: boolean
    circle?: boolean

    star?: boolean
    star2?: boolean
    triangle?: boolean
    triangle2?: boolean
    triangle3?: boolean
    triangle4?: boolean

    size?: 'lg' | 'md' | 'sm' | 'xs' | 'xl'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    count: 5,
  },
)
const emit = defineEmits(['update:modelValue'])

const max = computed(() => Number.parseInt(props.count as string))

function handleValue(digit: number, half = false) {
  if (props.disabled) {
    return
  }

  if (props.half) {
    emit('update:modelValue', half ? digit - 0.5 : digit)
    return
  }

  emit('update:modelValue', digit)
}

// Check if any shape prop is set
const hasShape = computed(() => {
  return (
    props.shape ||
    props.squircle ||
    props.heart ||
    props.hexagon ||
    props.hexagon2 ||
    props.decagon ||
    props.pentagon ||
    props.diamond ||
    props.square ||
    props.circle ||
    props.star ||
    props.star2 ||
    props.triangle ||
    props.triangle2 ||
    props.triangle3 ||
    props.triangle4
  )
})
</script>

<template>
  <div
    class="rating"
    :class="{
      'rating-half': half,
      'rating-xl': xl || size === 'xl',
      'rating-lg': lg || size === 'lg',
      'rating-md': md || size === 'md',
      'rating-sm': sm || size === 'sm',
      'rating-xs': xs || size === 'xs',
      'opacity-60': disabled,
      'cursor-not-allowed': disabled,
    }"
  >
    <input
      type="radio"
      :value="0"
      class="rating-hidden"
      :checked="modelValue === 0"
      @change="$emit('update:modelValue', 0)"
    />
    <template v-for="digit in max" :key="digit">
      <input
        type="radio"
        :value="half ? digit - 0.5 : digit"
        :disabled="disabled"
        class="mask"
        :class="[
          bg,
          { 'mask-half-1': half },
          { 'cursor-not-allowed opacity-50': disabled },

          // Color classes
          { 'bg-neutral': neutral || color === 'neutral' },
          { 'bg-primary': primary || color === 'primary' },
          { 'bg-secondary': secondary || color === 'secondary' },
          { 'bg-accent': accent || color === 'accent' },
          { 'bg-info': info || color === 'info' },
          { 'bg-success': success || color === 'success' },
          { 'bg-warning': warning || color === 'warning' },
          { 'bg-error': error || color === 'error' },

          // Shape classes
          { 'mask-squircle': squircle || shape === 'squircle' },
          { 'mask-heart': heart || shape === 'heart' },
          { 'mask-hexagon': hexagon || shape === 'hexagon' },
          { 'mask-hexagon-2': hexagon2 || shape === 'hexagon-2' },
          { 'mask-decagon': decagon || shape === 'decagon' },
          { 'mask-pentagon': pentagon || shape === 'pentagon' },
          { 'mask-diamond': diamond || shape === 'diamond' },
          { 'mask-square': square || shape === 'square' },
          { 'mask-circle': circle || shape === 'circle' },
          { 'mask-star': star || shape === 'star' },
          { 'mask-star-2': star2 || shape === 'star-2' || !hasShape },
          { 'mask-triangle': triangle || shape === 'triangle' },
          { 'mask-triangle-2': triangle2 || shape === 'triangle-2' },
          { 'mask-triangle-3': triangle3 || shape === 'triangle-3' },
          { 'mask-triangle-4': triangle4 || shape === 'triangle-4' },
        ]"
        :checked="half ? modelValue === digit - 0.5 : modelValue === digit"
        @change="() => handleValue(digit, true)"
      />
      <input
        v-if="half"
        type="radio"
        :value="digit"
        class="mask mask-half-2"
        :disabled="disabled"
        :class="[
          bg,
          { 'cursor-not-allowed opacity-50': disabled },

          // Color classes
          { 'bg-neutral': neutral || color === 'neutral' },
          { 'bg-primary': primary || color === 'primary' },
          { 'bg-secondary': secondary || color === 'secondary' },
          { 'bg-accent': accent || color === 'accent' },
          { 'bg-info': info || color === 'info' },
          { 'bg-success': success || color === 'success' },
          { 'bg-warning': warning || color === 'warning' },
          { 'bg-error': error || color === 'error' },

          // Shape classes
          { 'mask-squircle': squircle || shape === 'squircle' },
          { 'mask-heart': heart || shape === 'heart' },
          { 'mask-hexagon': hexagon || shape === 'hexagon' },
          { 'mask-hexagon-2': hexagon2 || shape === 'hexagon-2' },
          { 'mask-decagon': decagon || shape === 'decagon' },
          { 'mask-pentagon': pentagon || shape === 'pentagon' },
          { 'mask-diamond': diamond || shape === 'diamond' },
          { 'mask-square': square || shape === 'square' },
          { 'mask-circle': circle || shape === 'circle' },
          { 'mask-star': star || shape === 'star' },
          { 'mask-star-2': star2 || shape === 'star-2' || !hasShape },
          { 'mask-triangle': triangle || shape === 'triangle' },
          { 'mask-triangle-2': triangle2 || shape === 'triangle-2' },
          { 'mask-triangle-3': triangle3 || shape === 'triangle-3' },
          { 'mask-triangle-4': triangle4 || shape === 'triangle-4' },
        ]"
        :checked="modelValue === digit"
        @change="() => handleValue(digit)"
      />
    </template>
  </div>
</template>
