<script setup>
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { computed, inject, nextTick, watch, watchEffect } from 'vue'
import { getPositionArea, getPositionFallbacks } from '../utils/position-area'

const autoFocus = inject('dropdownAutoFocus')
const id = inject('dropdownId')
const isOpen = inject('isDropdownOpen')
const contentEl = inject('contentEl')
const placement = inject('dropdownPlacement')
const closeOnClickOutside = inject('dropdownCloseOnClickOutside')

// Dropdown Utils
const toggle = inject('toggleDropdown')
const open = inject('openDropdown')
const close = inject('closeDropdown')

// Compute CSS position-area value based on placement
const positionArea = computed(() => getPositionArea(placement.value))
const positionFallbacks = computed(() => getPositionFallbacks(placement.value))

// Determine popover mode: "auto" for light dismiss, "manual" to disable it
const popoverMode = computed(() => (closeOnClickOutside.value ? 'auto' : 'manual'))

let activate
let deactivate

if (autoFocus.value) {
  const { activate: _activate, deactivate: _deactivate, hasFocus } = useFocusTrap(contentEl, { immediate: true })
  activate = _activate
  deactivate = _deactivate

  // hide the dropdown when the focus-trap drops focus (by pressing escape, for example)
  watchEffect(() => {
    if (!hasFocus.value) {
      close()
    }
  })
}

// Sync popover state with isOpen model (for programmatic control)
watch(
  isOpen,
  async newValue => {
    if (contentEl.value) {
      try {
        // Check current popover state
        const isPopoverOpen = contentEl.value.matches(':popover-open')

        // Only programmatically control if state differs
        if (newValue && !isPopoverOpen) {
          contentEl.value.showPopover()
          if (autoFocus.value) {
            await nextTick()
            activate?.()
          }
        } else if (!newValue && isPopoverOpen) {
          contentEl.value.hidePopover()
          if (autoFocus.value) {
            deactivate?.()
            await nextTick()
          }
        }
      } catch (e) {
        // Silently handle if popover API is not supported
        console.warn('Popover API not supported:', e)
      }
    }
  },
  { flush: 'post' },
)

// Listen to popover toggle events to sync back to isOpen model
function handleToggle(event) {
  const newState = event.newState === 'open'

  if (isOpen.value !== newState) {
    isOpen.value = newState

    if (newState && autoFocus.value) {
      nextTick().then(() => activate?.())
    } else if (!newState && autoFocus.value) {
      deactivate?.()
    }
  }
}
</script>

<template>
  <div
    :id="`${id}-content`"
    ref="contentEl"
    :anchor="id"
    :aria-labelledby="id"
    role="menu"
    :popover="popoverMode"
    class="dropdown-content dropdown-popover"
    :style="{
      'position-anchor': `--${id}`,
      'position-area': positionArea,
      'position-try-fallbacks': positionFallbacks,
    }"
    @toggle="handleToggle"
  >
    <slot v-bind="{ toggle, open, close }" />
  </div>
</template>

<style>
@layer components {
  /* Reset default popover styles - in components layer so utilities can override */
  .dropdown-popover[popover] {
    border: none;
    color: inherit;
    overflow: visible;
    /* Use auto for inset to allow anchor positioning to work */
    inset: auto;
    margin: 0;
    background-color: transparent;
  }

  /* Position anchoring support */
  .dropdown-popover[popover]:popover-open {
    position: fixed;
  }
}
</style>
