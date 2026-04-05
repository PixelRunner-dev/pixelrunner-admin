<script setup>
import { inject } from 'vue'

const id = inject('dropdownId')
const isOpen = inject('isDropdownOpen')
const buttonEl = inject('buttonEl')
</script>

<template>
  <button
    :id="id"
    ref="buttonEl"
    :aria-expanded="isOpen"
    aria-haspopup="menu"
    :popovertarget="`${id}-content`"
    :style="{ 'anchor-name': `--${id}` }"
    class="dropdown-target"
  >
    <slot />
  </button>
</template>
