<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  modelValue?: boolean | null
  rotate?: boolean
  flip?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const checkbox = ref<HTMLInputElement | null>(null)

// Keep the checkbox's indeterminate property in sync with modelValue
watch(
  () => props.modelValue,
  val => {
    nextTick(() => {
      if (checkbox.value) {
        checkbox.value.indeterminate = val === null
      }
    })
  },
  { immediate: true },
)

function updateValue(event: Event) {
  const input = event.target as HTMLInputElement
  // If indeterminate, toggle to checked
  if (props.modelValue === null) {
    emit('update:modelValue', true)
  } else {
    emit('update:modelValue', input.checked)
  }
}
</script>

<template>
  <label
    class="swap"
    :class="{
      'swap-rotate': rotate,
      'swap-flip': flip,
    }"
  >
    <input ref="checkbox" type="checkbox" :checked="modelValue === true" @change="updateValue" />
    <div class="swap-indeterminate">
      <slot name="indeterminate" />
    </div>
    <div class="swap-on">
      <slot name="swap" />
    </div>
    <div class="swap-off">
      <slot />
    </div>
  </label>
</template>
