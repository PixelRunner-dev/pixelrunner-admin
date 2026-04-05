<script setup lang="ts">
const props = defineProps<{
  is?: any
  disabled?: boolean
}>()
</script>

<template>
  <component :is="props.is || 'div'" :class="{ 'hover-3d': !props.disabled }">
    <slot />
    <template v-if="!props.disabled">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </template>
  </component>
</template>
