<script setup lang="ts">
import type { DockState } from './Dock.vue'
import { inject, onUnmounted, useId } from 'vue'

const { active } = defineProps<{
  active?: boolean
}>()

const itemId = useId()
const { registerItem, setActiveItemId, activeItemId } = inject<DockState>('dockState')!
const unregister = registerItem(itemId)

onUnmounted(() => {
  unregister()
})
</script>

<template>
  <div
    :id="`dock-item-${itemId}`"
    class="dock-item"
    :class="{ 'dock-active': active || activeItemId === itemId }"
    @click="setActiveItemId(itemId)"
  >
    <slot />
  </div>
</template>
