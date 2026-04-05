<script setup lang="ts">
defineProps<{
  orientation?: 'vertical' | 'horizontal'
  vertical?: boolean
  horizontal?: boolean
}>()
</script>

<template>
  <div
    class="stat"
    :class="{
      'stat-vertical': vertical || orientation === 'vertical',
      'stat-horizontal': horizontal || orientation === 'horizontal',
    }"
  >
    <slot />
  </div>
</template>
