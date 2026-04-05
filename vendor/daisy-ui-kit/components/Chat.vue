<script setup lang="ts">
const {
  pre,
  align = 'start',
  start,
  end,
} = defineProps<{
  pre?: boolean
  align?: string
  start?: boolean
  end?: boolean
}>()
</script>

<template>
  <div
    class="chat"
    :class="{
      'chat-start': start || (!end && align === 'start'),
      'chat-end': end || align === 'end',
      'whitespace-pre': pre,
    }"
  >
    <slot />
  </div>
</template>
