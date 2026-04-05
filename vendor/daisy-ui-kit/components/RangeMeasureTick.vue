<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  tick: number
  modelValue?: number | string
  numbered?: boolean
  asButton?: boolean
  isHidden?: boolean
  disabled?: boolean
}>()
defineEmits(['update:modelValue'])

const hasChanged = ref(false)
const { isPending, start, stop } = useTimeoutFn(() => {
  hasChanged.value = false
}, 1000)
watch(
  () => props.modelValue,
  val => {
    if (val) {
      start()
      hasChanged.value = true
    } else if (!isPending.value) {
      stop()
    }
  },
)

// eslint-disable-next-line eqeqeq
const isCurrent = computed(() => props.modelValue == props.tick)
</script>

<template>
  <Button
    v-if="asButton && !isHidden"
    xs
    :ghost="!isCurrent"
    circle
    :class="{
      'font-bold': isCurrent,
      'opacity-50': props.disabled,
      'cursor-pointer': !props.disabled,
      'cursor-not-allowed': props.disabled,
    }"
    :disabled="disabled"
    @click="$emit('update:modelValue', tick)"
  >
    {{ numbered ? tick : '|' }}
  </Button>
  <Tooltip
    v-else
    :tip="tick"
    :open="hasChanged && isCurrent && !disabled"
    position="bottom"
    :class="{
      'px-[2px]': !asButton,
      'opacity-50': disabled,
      'cursor-pointer': !disabled,
      'cursor-not-allowed': disabled,
    }"
    @click="$emit('update:modelValue', tick)"
  >
    <Text v-if="!isHidden" :black="isCurrent">
      {{ numbered ? tick : '|' }}
    </Text>
  </Tooltip>
</template>
