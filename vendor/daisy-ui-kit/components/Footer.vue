<script setup lang="ts">
import Text from './Text.vue'

const props = withDefaults(
  defineProps<{
    center?: boolean
    is?: string
    orientation?: 'horizontal' | 'vertical'
    horizontal?: boolean
    vertical?: boolean
  }>(),
  {
    center: false,
    is: 'footer',
  },
)
</script>

<template>
  <Text
    :is="is"
    class="footer"
    :class="{
      'divider-center': props.center,
      'divider-horizontal': props.horizontal || props.orientation === 'horizontal',
      'divider-vertical': props.vertical || props.orientation === 'vertical',
    }"
  >
    <slot />
  </Text>
</template>
