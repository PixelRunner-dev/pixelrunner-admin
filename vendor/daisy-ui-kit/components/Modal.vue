<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    closeOnClickOutside?: boolean
    placement?: 'top' | 'bottom' | 'start' | 'end'
    top?: boolean
    bottom?: boolean
    start?: boolean
    end?: boolean
  }>(),
  {
    closeOnClickOutside: true,
  },
)
const emit = defineEmits(['update:modelValue'])

const is = 'div'

// defineModel 'open'
const _isOpen = ref(props.modelValue)
watch(
  () => props.modelValue,
  val => {
    _isOpen.value = val
  },
)
const isOpen = computed({
  get: () => _isOpen.value,
  set: val => {
    _isOpen.value = val
    if (props.modelValue !== val) {
      emit('update:modelValue', val)
    }
  },
})

function handleClick() {
  if (props.closeOnClickOutside) {
    isOpen.value = false
  }
}
</script>

<template>
  <input v-model="isOpen" type="checkbox" class="modal-toggle" />
  <Component
    :is="is"
    v-bind="{ ...$attrs, ...$props }"
    class="modal"
    :class="{
      'modal-top': props.top,
      'modal-bottom': props.bottom,
      'modal-start': props.start,
      'modal-end': props.end,
    }"
    @click.self="handleClick"
  >
    <slot />
  </Component>
</template>
