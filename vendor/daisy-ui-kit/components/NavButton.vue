<script setup lang="ts">
const { active = false, disabled = false } = defineProps<{
  active?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <button class="nav-button" :class="{ active, disabled }">
    <slot />
  </button>
</template>
