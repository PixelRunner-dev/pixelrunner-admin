<script setup lang="ts">
import { computed, inject } from 'vue'

// Map input type to value type
type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'week'
  | 'month'
  | 'tel'
  | 'url'
  | 'search'
  | 'time'
  | 'color'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    type?: InputType
    placeholder?: string
    disabled?: boolean
    validator?: boolean
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
    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    type: 'text',
  },
)
const emit = defineEmits(['update:modelValue'])

// For slot context
function setValue(val: string | number | null) {
  emit('update:modelValue', val)
}

const labelCtx = inject('labelCtx', null)

function handleInput(event: Event) {
  let val: string | number | null
  if (props.type === 'number') {
    const inputVal = (event.target as HTMLInputElement).value
    val = inputVal === '' ? null : Number(inputVal)
  } else {
    val = (event.target as HTMLInputElement).value
  }
  emit('update:modelValue', val)
}

const inputAttrs = computed(() => {
  if (labelCtx) {
    return {
      type: props.type,
      placeholder: props.placeholder,
      disabled: props.disabled,
    }
  }
  return {
    type: props.type,
    placeholder: props.placeholder,
    disabled: props.disabled,
    class: [
      'input',
      { validator: props.validator },
      { 'input-primary': props.primary || props.color === 'primary' },
      { 'input-secondary': props.secondary || props.color === 'secondary' },
      { 'input-accent': props.accent || props.color === 'accent' },
      { 'input-info': props.info || props.color === 'info' },
      { 'input-success': props.success || props.color === 'success' },
      { 'input-warning': props.warning || props.color === 'warning' },
      { 'input-error': props.error || props.color === 'error' },
      { 'input-ghost': props.ghost },
      { 'input-xl': props.xl || props.size === 'xl' },
      { 'input-lg': props.lg || props.size === 'lg' },
      { 'input-md': props.md || props.size === 'md' },
      { 'input-sm': props.sm || props.size === 'sm' },
      { 'input-xs': props.xs || props.size === 'xs' },
      { 'join-item': props.join },
    ],
  }
})
const inputModel = computed({
  get: () => props.modelValue,
  set: setValue,
})
</script>

<template>
  <div v-if="$slots.default">
    <slot
      :value="inputModel"
      :set-value="setValue"
      :input-attrs="inputAttrs"
      :props="props"
      :input-model="inputModel"
    />
  </div>
  <input v-else v-bind="inputAttrs" :value="inputModel" @input="handleInput" />
</template>
