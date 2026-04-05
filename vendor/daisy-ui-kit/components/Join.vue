<script setup lang="ts">
defineProps<{
  direction?: 'horizontal' | 'vertical'
  horizontal?: boolean
  vertical?: boolean
}>()
</script>

<template>
  <div
    class="join"
    :class="{
      'join-vertical': direction === 'vertical' || vertical,
      'join-horizontal': direction === 'horizontal' || horizontal,
    }"
  >
    <slot />
  </div>
</template>
