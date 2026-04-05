<script lang="ts" setup>
defineProps<{
  displayClasses?: string
}>()
</script>

<template>
  <div class="mockup-phone">
    <div class="mockup-phone-camera" />
    <div class="mockup-phone-display" :class="displayClasses">
      <slot />
    </div>
  </div>
</template>
