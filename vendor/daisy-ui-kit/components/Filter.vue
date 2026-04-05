<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    is?: string
    name: string
    items: FilterItemInput[]
    modelValue?: any
    resetLabel?: string
    position?: 'start' | 'end'
    start?: boolean
    end?: boolean

    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean

    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    resetLabel: 'All',
    is: 'div',
  },
)

const emit = defineEmits(['update:modelValue'])

interface FilterItem {
  label: string
  value: any
}

type FilterItemInput = string | FilterItem

const currentValue = computed({
  get: () => props.modelValue,
  set(val) {
    emit('update:modelValue', val)
  },
})

const normalizedItems = computed(() => {
  return props.items.map(item => {
    if (typeof item === 'string') {
      return { label: item, value: item }
    }
    return item
  })
})
</script>

<template>
  <component :is="props.is" v-bind="$attrs" class="filter">
    <!-- Reset button at start -->
    <input
      v-if="resetLabel && (start || position === 'start')"
      v-model="currentValue"
      class="btn filter-reset"
      type="radio"
      :class="{
        'btn-xl': size === 'xl' || xl,
        'btn-lg': size === 'lg' || lg,
        'btn-md': size === 'md' || md,
        'btn-sm': size === 'sm' || sm,
        'btn-xs': size === 'xs' || xs,
      }"
      :name="name"
      :aria-label="resetLabel"
      :value="null"
    />

    <!-- Filter items -->
    <template v-for="(item, index) in normalizedItems" :key="index">
      <input
        v-model="currentValue"
        class="btn"
        :class="{
          'btn-neutral': color === 'neutral' || neutral,
          'btn-primary': color === 'primary' || primary,
          'btn-secondary': color === 'secondary' || secondary,
          'btn-accent': color === 'accent' || accent,
          'btn-info': color === 'info' || info,
          'btn-success': color === 'success' || success,
          'btn-warning': color === 'warning' || warning,
          'btn-error': color === 'error' || error,
          'btn-xl': size === 'xl' || xl,
          'btn-lg': size === 'lg' || lg,
          'btn-md': size === 'md' || md,
          'btn-sm': size === 'sm' || sm,
          'btn-xs': size === 'xs' || xs,
        }"
        type="radio"
        :name="name"
        :aria-label="item.label"
        :value="item.value"
      />
    </template>

    <!-- Reset button at end -->
    <input
      v-if="resetLabel && (end || position === 'end')"
      v-model="currentValue"
      class="btn filter-reset"
      type="radio"
      :name="name"
      :aria-label="resetLabel"
      :value="null"
    />

    <!-- Optional slot for custom items -->
    <slot />
  </component>
</template>
