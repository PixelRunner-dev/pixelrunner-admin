<script setup lang="ts">
import sprite from '@/icon-sprite.svg?raw';
</script>

<template>
  <div
    v-html="sprite"
    aria-hidden="true"
    style="position: absolute; width: 0; height: 0; overflow: hidden"
  ></div>
</template>
