<script setup lang="ts">
import { computed, inject } from 'vue'

const { is = 'div', name } = defineProps<{
  is?: any
  name: string
}>()

const tabManager: any = inject('tabManager')

const isCurrentTab = computed(() => {
  return tabManager.currentTab.value === name
})

if (!tabManager?.currentTab.value) {
  tabManager.currentTab.value = name
}

const existing = tabManager?.tabs?.find((t: string) => t === name)
if (!existing) {
  tabManager.tabs.push(name)
}
</script>

<template>
  <component :is="is" v-show="isCurrentTab" class="tab-content">
    <slot />
  </component>
</template>
