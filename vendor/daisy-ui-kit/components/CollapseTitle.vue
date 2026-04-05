<script setup lang="ts">
import { inject } from 'vue'

const checkboxId = inject('collapseCheckboxId', null)
const hasToggle = inject('collapseToggle', false)
</script>

<template>
  <label v-if="hasToggle && checkboxId" :for="checkboxId" class="collapse-title">
    <slot />
  </label>
  <div v-else class="collapse-title">
    <slot />
  </div>
</template>
