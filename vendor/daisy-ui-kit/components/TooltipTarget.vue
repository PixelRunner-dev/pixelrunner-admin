<script setup>
import { inject } from 'vue'

const id = inject('tooltipId')
const targetEl = inject('targetEl')
</script>

<template>
  <div
    :id="id"
    ref="targetEl"
    :aria-describedby="`${id}-content`"
    :popovertarget="`${id}-content`"
    popovertargetaction="toggle"
    :style="{ 'anchor-name': `--${id}` }"
    class="tooltip-target inline-block"
  >
    <slot />
  </div>
</template>
