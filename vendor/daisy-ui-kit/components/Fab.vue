<script setup lang="ts">
defineProps<{
  flower?: boolean
}>()
</script>

<template>
  <div
    class="fab"
    :class="{
      'fab-flower': flower,
    }"
  >
    <slot />
  </div>
</template>
