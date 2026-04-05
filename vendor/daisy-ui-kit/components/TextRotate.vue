<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  is?: any
  center?: boolean
  duration?: number
}>()

const style = computed(() => {
  if (props.duration) {
    return { animationDuration: `${props.duration}ms` }
  }
  return undefined
})
</script>

<template>
  <component :is="props.is || 'span'" class="text-rotate" :style="style">
    <span :class="{ 'justify-items-center': props.center }">
      <slot />
    </span>
  </component>
</template>
