<script setup lang="ts">
import Text from './Text.vue'

const { is = 'div' } = defineProps<{
  is?: string
}>()
</script>

<template>
  <Text :is="is" class="card-actions">
    <slot />
  </Text>
</template>
