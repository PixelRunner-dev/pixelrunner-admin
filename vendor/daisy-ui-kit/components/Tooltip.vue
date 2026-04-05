<script setup lang="ts">
import { useElementHover } from '@vueuse/core'
import { computed, onMounted, provide, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    tip?: string | number
    open?: boolean

    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean

    position?: 'top' | 'right' | 'bottom' | 'left'
    top?: boolean
    right?: boolean
    bottom?: boolean
    left?: boolean

    // Popover mode props
    delayEnter?: number
    delayLeave?: number
  }>(),
  {
    delayEnter: 200,
    delayLeave: 100,
  },
)

// Detect if using popover mode (when TooltipTarget/TooltipContent are used)
const isPopoverMode = computed(() => {
  return !props.tip
})

// Popover mode setup
const isOpen = defineModel('open', { default: false })
provide('isTooltipOpen', isOpen)

const uniqueId = useId()
const id = `tooltip-${uniqueId}`
provide('tooltipId', id)

// Compute placement for CSS anchor positioning
const placement = computed(() => {
  if (props.top || props.position === 'top') return 'top'
  if (props.right || props.position === 'right') return 'right'
  if (props.left || props.position === 'left') return 'left'
  return 'bottom' // default
})
provide('tooltipPlacement', placement)

// Provide color for TooltipContent
const color = computed(() => {
  if (props.color) return props.color
  if (props.neutral) return 'neutral'
  if (props.primary) return 'primary'
  if (props.secondary) return 'secondary'
  if (props.accent) return 'accent'
  if (props.info) return 'info'
  if (props.success) return 'success'
  if (props.warning) return 'warning'
  if (props.error) return 'error'
  return null
})
provide('tooltipColor', color)

// References
const targetEl = ref(null)
const contentEl = ref(null)
provide('targetEl', targetEl)
provide('contentEl', contentEl)

// Visibility utils
function open() {
  isOpen.value = true
}
function close() {
  isOpen.value = false
}
provide('openTooltip', open)
provide('closeTooltip', close)

const tooltipWrapper = ref(null)

onMounted(() => {
  if (isPopoverMode.value) {
    const hover = useElementHover(tooltipWrapper, {
      delayLeave: props.delayLeave,
      delayEnter: props.delayEnter,
    })

    watch(hover, newValue => {
      isOpen.value = newValue
    })
  }
})
</script>

<template>
  <!-- CSS-only mode (when tip prop is provided) -->
  <div
    v-if="!isPopoverMode"
    :data-tip="tip"
    class="tooltip"
    :class="{
      'tooltip-open': props.open,

      'tooltip-top': props.top || props.position === 'top',
      'tooltip-bottom': props.bottom || props.position === 'bottom',
      'tooltip-left': props.left || props.position === 'left',
      'tooltip-right': props.right || props.position === 'right',

      'tooltip-neutral': props.neutral || props.color === 'neutral',
      'tooltip-primary': props.primary || props.color === 'primary',
      'tooltip-secondary': props.secondary || props.color === 'secondary',
      'tooltip-accent': props.accent || props.color === 'accent',
      'tooltip-info': props.info || props.color === 'info',
      'tooltip-success': props.success || props.color === 'success',
      'tooltip-warning': props.warning || props.color === 'warning',
      'tooltip-error': props.error || props.color === 'error',
    }"
  >
    <slot />
  </div>

  <!-- Popover API mode (when using TooltipTarget/TooltipContent) -->
  <div v-else ref="tooltipWrapper" class="tooltip-wrapper inline-block">
    <slot />
  </div>
</template>
