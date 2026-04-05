<script setup lang="ts">
import { computed, inject, provide, ref, useId, watch } from 'vue'

const props = defineProps<{
  id?: string
  variant?: 'arrow' | 'plus'
  arrow?: boolean
  plus?: boolean
  open?: boolean
  close?: boolean
  toggle?: boolean
  value?: any
}>()

const isOpen = defineModel('open', { default: false })

const accordionValue = inject('accordion-value', ref(null))
const useAccordion = accordionValue.value !== null

// Internal state for toggle mode
const internalChecked = ref(props.open || false)

// Generate unique ID for checkbox
const checkboxId = props.id || `collapse-${useId()}`
provide('collapseCheckboxId', checkboxId)
provide('collapseToggle', props.toggle || useAccordion)

// Sync internal state with modelValue
watch(
  () => isOpen.value,
  newVal => {
    internalChecked.value = newVal
  },
)

watch(internalChecked, newVal => {
  isOpen.value = newVal
})

function handleClick() {
  // Only handle clicks for accordion mode
  if (useAccordion) {
    accordionValue.value = props.value
  }
}

const isChecked = computed(() => {
  if (useAccordion) {
    return accordionValue.value === props.value
  }
  return internalChecked.value
})
</script>

<template>
  <div
    :tabindex="props.toggle || useAccordion ? undefined : 0"
    class="collapse"
    :class="[
      { 'collapse-arrow': props.arrow || props.variant === 'arrow' },
      { 'collapse-plus': props.plus || props.variant === 'plus' },
      { 'collapse-open': (props.open && !props.close) || (useAccordion && accordionValue === props.value) },
      { 'collapse-close': props.close },
    ]"
    @click="useAccordion ? handleClick : undefined"
  >
    <input
      v-if="props.toggle || useAccordion"
      :id="checkboxId"
      v-model="internalChecked"
      :type="useAccordion ? 'radio' : 'checkbox'"
      :checked="useAccordion ? isChecked : undefined"
    />
    <slot />
  </div>
</template>
