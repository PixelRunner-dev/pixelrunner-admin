<script setup lang="ts">
import { useElementHover } from '@vueuse/core'
import { onMounted, provide, ref, useId, watch  } from 'vue'

const props = withDefaults(
  defineProps<{
    autoFocus?: boolean

    placement?:
      | 'top'
      | 'top-start'
      | 'top-end'
      | 'right'
      | 'right-start'
      | 'right-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
      | 'left'
      | 'left-start'
      | 'left-end'

    hover?: boolean
    delayEnter?: number
    delayLeave?: number
    closeOnClickOutside?: boolean
  }>(),
  {
    autoFocus: false,
    placement: 'bottom-start',
    hover: false,
    delayEnter: 0,
    delayLeave: 300,
    closeOnClickOutside: true,
  },
)

// Dropdown Visibility
const isOpen = defineModel('open', { default: false })
provide('isDropdownOpen', isOpen)

const autoFocus = ref(props.autoFocus)
provide('dropdownAutoFocus', autoFocus)

// Use Nuxt's useId() for unique IDs
const uniqueId = useId()
const wrapperId = `dropdown-wrapper-${uniqueId}`
const id = `dropdown-${uniqueId}`
provide('dropdownId', id)

// Provide placement for CSS anchor positioning
provide('dropdownPlacement', ref(props.placement))

// Provide closeOnClickOutside for popover mode selection
provide('dropdownCloseOnClickOutside', ref(props.closeOnClickOutside))

// Provide hover mode for button behavior
provide('dropdownHover', ref(props.hover))

// References
const buttonEl = ref(null)
const contentEl = ref(null)

provide('buttonEl', buttonEl)
provide('contentEl', contentEl)

// Visibility Utils
function toggle() {
  isOpen.value = !isOpen.value
}
function open() {
  isOpen.value = true
}
function close() {
  isOpen.value = false
}
provide('toggleDropdown', toggle)
provide('openDropdown', open)
provide('closeDropdown', close)

const dropdownWrapper = ref(null)

onMounted(() => {
  // Note: closeOnClickOutside is handled automatically by popover="auto"
  // The popover API provides "light dismiss" behavior by default

  // Sync with hover state for SSR compatibility
  if (props.hover) {
    const hover = useElementHover(dropdownWrapper, {
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
  <div :id="wrapperId" ref="dropdownWrapper" class="relative inline-block">
    <slot v-bind="{ toggle, open, close }" />
  </div>
</template>
