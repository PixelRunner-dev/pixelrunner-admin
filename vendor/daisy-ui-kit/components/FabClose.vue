<script setup lang="ts">
function handleMouseDown(event: MouseEvent) {
  event.preventDefault()
  const fab = (event.currentTarget as HTMLElement)?.closest('.fab')
  if (fab instanceof HTMLElement) {
    fab.blur()
  }
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
</script>

<template>
  <div class="fab-close" @mousedown="handleMouseDown">
    <slot />
  </div>
</template>
