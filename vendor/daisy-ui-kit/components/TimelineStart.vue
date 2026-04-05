<script setup lang="ts">
defineProps<{ box?: boolean }>()
</script>

<template>
  <div
    class="timeline-start"
    :class="{
      'timeline-box': box,
    }"
  >
    <slot />
  </div>
</template>
