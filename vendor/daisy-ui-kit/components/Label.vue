<script setup lang="ts">
import { provide, ref } from 'vue'
import Text from './Text.vue'

withDefaults(
  defineProps<{
    is?: string
    floating?: boolean

    input?: boolean
    select?: boolean
    toggle?: boolean

    join?: boolean
    color?: string
    neutral?: boolean
    primary?: boolean
    secondary?: boolean
    accent?: boolean
    info?: boolean
    success?: boolean
    warning?: boolean
    error?: boolean
    ghost?: boolean
    size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    is: 'label',
  },
)

// Provide label context for child inputs
const checked = ref(false)
provide('labelCtx', { checked })
</script>

<template>
  <Text
    :is="is"
    :class="[
      {
        input,
        select,
        toggle,
        'join-item': (input || select || toggle) && join,
        'input-neutral': input && (neutral || color === 'neutral'),
        'input-primary': input && (primary || color === 'primary'),
        'input-secondary': input && (secondary || color === 'secondary'),
        'input-accent': input && (accent || color === 'accent'),
        'input-info': input && (info || color === 'info'),
        'input-success': input && (success || color === 'success'),
        'input-warning': input && (warning || color === 'warning'),
        'input-error': input && (error || color === 'error'),
        'input-ghost': input && ghost,
        'input-xl': input && (size === 'xl' || xl),
        'input-lg': input && (size === 'lg' || lg),
        'input-md': input && (size === 'md' || md),
        'input-sm': input && (size === 'sm' || sm),
        'input-xs': input && (size === 'xs' || xs),
        'select-neutral': select && (neutral || color === 'neutral'),
        'select-primary': select && (primary || color === 'primary'),
        'select-secondary': select && (secondary || color === 'secondary'),
        'select-accent': select && (accent || color === 'accent'),
        'select-info': select && (info || color === 'info'),
        'select-success': select && (success || color === 'success'),
        'select-warning': select && (warning || color === 'warning'),
        'select-error': select && (error || color === 'error'),
        'select-ghost': select && ghost,
        'select-xl': select && (size === 'xl' || xl),
        'select-lg': select && (size === 'lg' || lg),
        'select-md': select && (size === 'md' || md),
        'select-sm': select && (size === 'sm' || sm),
        'select-xs': select && (size === 'xs' || xs),
        'text-neutral': toggle && checked && (neutral || color === 'neutral'),
        'text-primary': toggle && checked && (primary || color === 'primary'),
        'text-secondary': toggle && checked && (secondary || color === 'secondary'),
        'text-accent': toggle && checked && (accent || color === 'accent'),
        'text-info': toggle && checked && (info || color === 'info'),
        'text-success': toggle && checked && (success || color === 'success'),
        'text-warning': toggle && checked && (warning || color === 'warning'),
        'text-error': toggle && checked && (error || color === 'error'),
        'text-ghost': toggle && ghost,
        'toggle-xl': toggle && (size === 'xl' || xl),
        'toggle-lg': toggle && (size === 'lg' || lg),
        'toggle-md': toggle && (size === 'md' || md),
        'toggle-sm': toggle && (size === 'sm' || sm),
        'toggle-xs': toggle && (size === 'xs' || xs),
      },
      { label: !floating && !(input || toggle) },
      { 'floating-label': floating },
    ]"
  >
    <slot />
  </Text>
</template>
