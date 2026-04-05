<script setup>
import { computed, inject, ref, watch } from 'vue'
import { getPositionArea, getPositionFallbacks } from '../utils/position-area'

const id = inject('tooltipId', null)
const isOpen = inject('isTooltipOpen', ref(false))
const contentEl = inject('contentEl', ref(null))
const placement = inject('tooltipPlacement', ref('bottom'))
const color = inject('tooltipColor', ref(null))

// Check if we're in popover mode (inside a Tooltip wrapper with context)
const isPopoverMode = computed(() => id !== null)

// Compute CSS position-area value based on placement
const positionArea = computed(() => getPositionArea(placement.value))
const positionFallbacks = computed(() => getPositionFallbacks(placement.value))

// Color classes for the tooltip
const colorClass = computed(() => {
  if (!color.value) return ''
  const colorMap = {
    neutral: 'tooltip-neutral',
    primary: 'tooltip-primary',
    secondary: 'tooltip-secondary',
    accent: 'tooltip-accent',
    info: 'tooltip-info',
    success: 'tooltip-success',
    warning: 'tooltip-warning',
    error: 'tooltip-error',
  }
  return colorMap[color.value] || ''
})

// Sync popover state with isOpen model
watch(
  isOpen,
  newValue => {
    if (!isPopoverMode.value || !contentEl.value) return

    try {
      const isPopoverOpen = contentEl.value.matches(':popover-open')

      if (newValue && !isPopoverOpen) {
        contentEl.value.showPopover()
      } else if (!newValue && isPopoverOpen) {
        contentEl.value.hidePopover()
      }
    } catch (e) {
      console.warn('Popover API not supported:', e)
    }
  },
  { flush: 'post' },
)

// Listen to popover toggle events to sync back to isOpen model
function handleToggle(event) {
  const newState = event.newState === 'open'
  if (isOpen.value !== newState) {
    isOpen.value = newState
  }
}
</script>

<template>
  <!-- Popover mode -->
  <div
    v-if="isPopoverMode"
    :id="`${id}-content`"
    ref="contentEl"
    :anchor="id"
    :data-placement="placement"
    role="tooltip"
    popover="manual"
    class="tooltip-popover"
    :class="colorClass"
    :style="{
      'position-anchor': `--${id}`,
      'position-area': positionArea,
      'position-try-fallbacks': positionFallbacks,
    }"
    @toggle="handleToggle"
  >
    <slot />
  </div>

  <!-- Simple mode (no Tooltip wrapper context) -->
  <div v-else class="tooltip-content">
    <slot />
  </div>
</template>

<style>
@layer components {
  .tooltip-popover[popover] {
    border: none;
    overflow: visible;
    inset: auto;
    margin: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border-radius: var(--radius-selector, 0.25rem);
    background-color: var(--color-neutral);
    color: var(--color-neutral-content);
    max-width: 20rem;
  }

  .tooltip-popover[popover]:popover-open {
    position: fixed;
  }

  /* Arrow base styles */
  .tooltip-popover[popover]::before {
    content: '';
    position: absolute;
    border: 6px solid transparent;
  }

  /* Bottom placement - arrow points up */
  .tooltip-popover[data-placement='bottom'] {
    margin-top: 6px;
  }
  .tooltip-popover[data-placement='bottom']::before {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--color-neutral);
  }

  /* Top placement - arrow points down */
  .tooltip-popover[data-placement='top'] {
    margin-bottom: 6px;
  }
  .tooltip-popover[data-placement='top']::before {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--color-neutral);
  }

  /* Right placement - arrow points left */
  .tooltip-popover[data-placement='right'] {
    margin-left: 6px;
  }
  .tooltip-popover[data-placement='right']::before {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--color-neutral);
  }

  /* Left placement - arrow points right */
  .tooltip-popover[data-placement='left'] {
    margin-right: 6px;
  }
  .tooltip-popover[data-placement='left']::before {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--color-neutral);
  }

  /* Color variants */
  .tooltip-popover.tooltip-primary {
    background-color: var(--color-primary);
    color: var(--color-primary-content);
  }
  .tooltip-popover.tooltip-primary[data-placement='bottom']::before {
    border-bottom-color: var(--color-primary);
  }
  .tooltip-popover.tooltip-primary[data-placement='top']::before {
    border-top-color: var(--color-primary);
  }
  .tooltip-popover.tooltip-primary[data-placement='right']::before {
    border-right-color: var(--color-primary);
  }
  .tooltip-popover.tooltip-primary[data-placement='left']::before {
    border-left-color: var(--color-primary);
  }

  .tooltip-popover.tooltip-secondary {
    background-color: var(--color-secondary);
    color: var(--color-secondary-content);
  }
  .tooltip-popover.tooltip-secondary[data-placement='bottom']::before {
    border-bottom-color: var(--color-secondary);
  }
  .tooltip-popover.tooltip-secondary[data-placement='top']::before {
    border-top-color: var(--color-secondary);
  }
  .tooltip-popover.tooltip-secondary[data-placement='right']::before {
    border-right-color: var(--color-secondary);
  }
  .tooltip-popover.tooltip-secondary[data-placement='left']::before {
    border-left-color: var(--color-secondary);
  }

  .tooltip-popover.tooltip-accent {
    background-color: var(--color-accent);
    color: var(--color-accent-content);
  }
  .tooltip-popover.tooltip-accent[data-placement='bottom']::before {
    border-bottom-color: var(--color-accent);
  }
  .tooltip-popover.tooltip-accent[data-placement='top']::before {
    border-top-color: var(--color-accent);
  }
  .tooltip-popover.tooltip-accent[data-placement='right']::before {
    border-right-color: var(--color-accent);
  }
  .tooltip-popover.tooltip-accent[data-placement='left']::before {
    border-left-color: var(--color-accent);
  }

  .tooltip-popover.tooltip-info {
    background-color: var(--color-info);
    color: var(--color-info-content);
  }
  .tooltip-popover.tooltip-info[data-placement='bottom']::before {
    border-bottom-color: var(--color-info);
  }
  .tooltip-popover.tooltip-info[data-placement='top']::before {
    border-top-color: var(--color-info);
  }
  .tooltip-popover.tooltip-info[data-placement='right']::before {
    border-right-color: var(--color-info);
  }
  .tooltip-popover.tooltip-info[data-placement='left']::before {
    border-left-color: var(--color-info);
  }

  .tooltip-popover.tooltip-success {
    background-color: var(--color-success);
    color: var(--color-success-content);
  }
  .tooltip-popover.tooltip-success[data-placement='bottom']::before {
    border-bottom-color: var(--color-success);
  }
  .tooltip-popover.tooltip-success[data-placement='top']::before {
    border-top-color: var(--color-success);
  }
  .tooltip-popover.tooltip-success[data-placement='right']::before {
    border-right-color: var(--color-success);
  }
  .tooltip-popover.tooltip-success[data-placement='left']::before {
    border-left-color: var(--color-success);
  }

  .tooltip-popover.tooltip-warning {
    background-color: var(--color-warning);
    color: var(--color-warning-content);
  }
  .tooltip-popover.tooltip-warning[data-placement='bottom']::before {
    border-bottom-color: var(--color-warning);
  }
  .tooltip-popover.tooltip-warning[data-placement='top']::before {
    border-top-color: var(--color-warning);
  }
  .tooltip-popover.tooltip-warning[data-placement='right']::before {
    border-right-color: var(--color-warning);
  }
  .tooltip-popover.tooltip-warning[data-placement='left']::before {
    border-left-color: var(--color-warning);
  }

  .tooltip-popover.tooltip-error {
    background-color: var(--color-error);
    color: var(--color-error-content);
  }
  .tooltip-popover.tooltip-error[data-placement='bottom']::before {
    border-bottom-color: var(--color-error);
  }
  .tooltip-popover.tooltip-error[data-placement='top']::before {
    border-top-color: var(--color-error);
  }
  .tooltip-popover.tooltip-error[data-placement='right']::before {
    border-right-color: var(--color-error);
  }
  .tooltip-popover.tooltip-error[data-placement='left']::before {
    border-left-color: var(--color-error);
  }
}
</style>
