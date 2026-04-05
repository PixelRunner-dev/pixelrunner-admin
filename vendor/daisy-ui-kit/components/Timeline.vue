<script setup lang="ts">
defineProps<{
  vertical?: boolean
  horizontal?: boolean
  compact?: boolean
  snapIcon?: boolean
}>()
</script>

<template>
  <ul
    class="timeline"
    :class="{
      'timeline-vertical': vertical,
      'timeline-horizontal': horizontal,
      'timeline-compact': compact,
      'timeline-snap-icon': snapIcon,
    }"
  >
    <slot />
  </ul>
</template>
