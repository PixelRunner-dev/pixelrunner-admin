<script setup>
import { inject } from 'vue'

const id = inject('dropdownId')
const isOpen = inject('isDropdownOpen')
const buttonEl = inject('buttonEl')
const isHover = inject('dropdownHover')
</script>

<template>
  <Button
    :id="id"
    ref="buttonEl"
    :aria-expanded="isOpen"
    aria-haspopup="menu"
    :popovertarget="`${id}-content`"
    :popovertargetaction="isHover ? 'show' : undefined"
    :style="{ 'anchor-name': `--${id}` }"
    class="dropdown-button"
  >
    <slot />
  </Button>
</template>
