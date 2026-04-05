<script setup lang="ts">
import type { Ref } from 'vue'

import { onClickOutside, useElementHover } from '@vueuse/core'
import { onMounted, provide, ref, useId } from 'vue'

// Define the MenuExpandState interface
export interface MenuExpandState {
  id: string
  isOpen: Ref<boolean>
  toggle: () => void
  open: () => void
  close: () => void
}

// Props with defaults
const {
  hover = false,
  delayLeave = 300,
  closeOnClickOutside = false,
} = defineProps<{
  hover?: boolean
  delayLeave?: number
  closeOnClickOutside?: boolean
}>()

// v-model for open state
const isOpen = defineModel('open', { default: false, type: Boolean })

// Generate IDs for accessibility and targeting
const uniqueId = useId()
const wrapperId = `expand-wrapper-${uniqueId}`
const id = `expand-${uniqueId}`

// Element reference for click outside detection
const expandEl = ref()

// Control functions
function toggle() {
  setTimeout(() => {
    isOpen.value = !isOpen.value
  }, 50)
}

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

// Create and provide the menu expand state object
const menuExpandState: MenuExpandState = {
  id,
  isOpen,
  toggle,
  open,
  close,
}

// Provide the state to child components
provide('menuExpandState', menuExpandState)

// Setup event handlers
onMounted(() => {
  // Handle clicks outside the component
  onClickOutside(expandEl, () => {
    if (closeOnClickOutside) {
      setTimeout(() => {
        isOpen.value = false
      }, 500)
    }
  })

  // Setup hover behavior if enabled
  if (hover) {
    useElementHover(expandEl, {
      delayLeave,
    })
  }
})

// Empty click handler for internal use
function handleClick(_ev: MouseEvent) {}
</script>

<template>
  <details :id="wrapperId" ref="expandEl" class="dropdown menu-expand" :open="isOpen" @click="handleClick">
    <slot v-bind="{ toggle, open, close }" />
  </details>
</template>
