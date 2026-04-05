<script setup lang="ts">
const props = defineProps<{
  orientation?: 'horizontal' | 'vertical'
  horizontal?: boolean
  vertical?: boolean
}>()
</script>

<template>
  <div
    class="avatar-group"
    :class="{
      'flex-row':
        props.orientation === 'horizontal' ||
        props.horizontal ||
        (!props.orientation && !props.vertical && !props.horizontal),
      'flex-col': props.orientation === 'vertical' || props.vertical,
    }"
  >
    <slot />
  </div>
</template>
