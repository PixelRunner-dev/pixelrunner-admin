<script setup lang="ts">
import type { MenuExpandState } from './MenuExpand.vue'

import { inject } from 'vue'

const menuExpandState = inject<MenuExpandState>('menuExpandState')
const { id, isOpen, toggle } = menuExpandState || {}
</script>

<template>
  <summary
    :id="id"
    :aria-expanded="isOpen"
    aria-haspopup="menu"
    class="menu-expand-toggle"
    @click.prevent.stop="toggle"
  >
    <slot />
  </summary>
</template>
