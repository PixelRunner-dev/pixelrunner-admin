<script setup lang="ts">
const { snapTo, center, end, vertical } = defineProps<{
  snapTo?: 'center' | 'end'
  center?: boolean
  end?: boolean
  orientation?: 'horizontal' | 'vertical'
  horizontal?: boolean
  vertical?: boolean
}>()
</script>

<template>
  <div
    class="carousel"
    :class="{
      'carousel-center': center || snapTo === 'center',
      'carousel-end': end || snapTo === 'end',
      'carousel-horizontal': horizontal || orientation === 'horizontal',
      'carousel-vertical': vertical || orientation === 'vertical',
    }"
  >
    <slot />
  </div>
</template>
