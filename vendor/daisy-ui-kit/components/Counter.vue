<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number | string
  is?: any
  digits?: 2 | 3 | '2' | '3'
}>()

const style = computed(() => {
  let css = `--value:${props.value};`
  if (props.digits) {
    css += `--digits:${props.digits};`
  }
  return css
})
</script>

<template>
  <component :is="props.is || 'span'" v-bind="$attrs" :style="style" />
</template>
