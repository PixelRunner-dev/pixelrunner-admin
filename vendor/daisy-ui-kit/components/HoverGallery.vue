<script setup lang="ts">
const props = defineProps<{
  is?: any
}>()
</script>

<template>
  <component :is="props.is || 'figure'" class="hover-gallery">
    <slot />
  </component>
</template>
