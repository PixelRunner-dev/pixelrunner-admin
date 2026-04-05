<script setup lang="ts">
import { provide, ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: string | number
}>()
const emit = defineEmits(['update:modelValue'])

const value = ref(props.modelValue)
watch(
  () => props.modelValue,
  val => {
    value.value = val
  },
)
watch(value, val => {
  if (props.modelValue !== val) {
    emit('update:modelValue', val)
  }
})

provide('accordion-value', value)
</script>

<template>
  <div class="daisy-ui-kit-accordion">
    <slot />
  </div>
</template>
