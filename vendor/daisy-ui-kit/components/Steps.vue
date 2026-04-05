<script setup lang="ts">
const {
  orientation,
  vertical = false,
  horizontal = false,
} = defineProps<{
  orientation?: 'vertical' | 'horizontal'
  vertical?: boolean
  horizontal?: boolean
}>()
</script>

<template>
  <ul
    class="steps"
    :class="{
      'steps-vertical': orientation === 'vertical' || vertical,
      'steps-horizontal': orientation === 'horizontal' || horizontal,
    }"
  >
    <slot />
  </ul>
</template>
