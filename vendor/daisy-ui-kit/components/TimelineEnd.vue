<script setup lang="ts">
defineProps<{ box?: boolean }>()
</script>

<template>
  <div
    class="timeline-end"
    :class="{
      'timeline-box': box,
    }"
  >
    <slot />
  </div>
</template>
