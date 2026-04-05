<script setup lang="ts">
import { provide } from 'vue'

const { name } = defineProps<{
  is?: any
  name: string

  variant?: 'box' | 'border' | 'lift'
  box?: boolean
  border?: boolean
  lift?: boolean

  placement?: 'top' | 'bottom'
  top?: boolean
  bottom?: boolean

  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  xl?: boolean
  lg?: boolean
  md?: boolean
  sm?: boolean
  xs?: boolean
}>()

const currentTab = defineModel<string>('currentTab')

const tabManager = {
  name,
  currentTab,
  tabs: [],
}
provide('tabManager', tabManager)
</script>

<template>
  <div
    class="tabs"
    :class="{
      'tabs-box': variant === 'box' || box,
      'tabs-border': variant === 'border' || border,
      'tabs-lift': variant === 'lift' || lift,
      'tabs-top': placement === 'top' || top,
      'tabs-bottom': placement === 'bottom' || bottom,
      'tabs-xl': size === 'xl' || xl,
      'tabs-lg': size === 'lg' || lg,
      'tabs-md': size === 'md' || md,
      'tabs-sm': size === 'sm' || sm,
      'tabs-xs': size === 'xs' || xs,
    }"
  >
    <slot />
  </div>
</template>
