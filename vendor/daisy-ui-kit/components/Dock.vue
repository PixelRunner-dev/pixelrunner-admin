<script setup lang="ts">
import type { Ref } from 'vue'
import { provide, ref } from 'vue'

const { size, xl, lg, md, sm, xs } = defineProps<{
  size?: string
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()

const activeItemId = ref<string | null>(null)
const itemIds = ref<string[]>([])

function registerItem(itemId: string) {
  itemIds.value.push(itemId)
  return function unregister() {
    itemIds.value = itemIds.value.filter(id => id !== itemId)
    if (activeItemId.value === itemId) {
      activeItemId.value = null
    }
  }
}

function setActiveItemId(itemId: string) {
  activeItemId.value = itemId
}

export interface DockState {
  activeItemId: Ref<string | null>
  registerItem: (itemId: string) => () => void
  setActiveItemId: (itemId: string) => void
}

provide<DockState>('dockState', {
  activeItemId,
  registerItem,
  setActiveItemId,
})
</script>

<template>
  <div
    class="dock"
    :class="{
      'dock-xl': xl || size === 'xl',
      'dock-lg': lg || size === 'lg',
      'dock-md': md || size === 'md',
      'dock-sm': sm || size === 'sm',
      'dock-xs': xs || size === 'xs',
    }"
  >
    <slot />
  </div>
</template>
