<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    type?: 'text' | 'phone' | 'email' | 'search'
    rows?: number
    autoExpand?: boolean

    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean

    ghost?: boolean
    disabled?: boolean
    validator?: boolean

    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    type: 'text',
    rows: 2,
  },
)
defineEmits(['update:modelValue'])

const textareaRef = ref<HTMLTextAreaElement | null>(null)

let minHeight = 0

function adjustHeight() {
  if (!props.autoExpand || !textareaRef.value) return
  const el = textareaRef.value

  // Capture the initial rendered height as minimum (respects rows attribute)
  if (minHeight === 0) {
    minHeight = el.offsetHeight
  }

  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`
}

watch(
  () => props.modelValue,
  () => {
    nextTick(adjustHeight)
  },
)

onMounted(() => {
  if (props.autoExpand) {
    nextTick(adjustHeight)
  }
})
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :type="type"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    class="textarea"
    :class="{
      'textarea-neutral': props.neutral || props.color === 'neutral',
      'textarea-primary': props.primary || props.color === 'primary',
      'textarea-secondary': props.secondary || props.color === 'secondary',
      'textarea-accent': props.accent || props.color === 'accent',
      'textarea-info': props.info || props.color === 'info',
      'textarea-success': props.success || props.color === 'success',
      'textarea-warning': props.warning || props.color === 'warning',
      'textarea-error': props.error || props.color === 'error',

      'textarea-ghost': props.ghost,
      validator: props.validator,

      'textarea-xl': props.xl || props.size === 'xl',
      'textarea-lg': props.lg || props.size === 'lg',
      'textarea-md': props.md || props.size === 'md',
      'textarea-sm': props.sm || props.size === 'sm',
      'textarea-xs': props.xs || props.size === 'xs',
    }"
    @input="
      event => {
        $emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
        adjustHeight()
      }
    "
  />
</template>
