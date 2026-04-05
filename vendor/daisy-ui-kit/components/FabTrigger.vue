<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    btn?: boolean
    join?: boolean
    close?: boolean

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
    link?: boolean
    glass?: boolean
    outline?: boolean
    dash?: boolean
    soft?: boolean

    shape?: 'circle' | 'square' | 'wide' | 'block'
    circle?: boolean
    square?: boolean
    wide?: boolean
    block?: boolean

    noAnimation?: boolean
    active?: boolean

    size?: 'lg' | 'md' | 'sm' | 'xs' | 'xl'
    xl?: boolean
    lg?: boolean
    md?: boolean
    sm?: boolean
    xs?: boolean
  }>(),
  {
    btn: true,
  },
)

function handleMouseDown(event: MouseEvent) {
  if (!props.close) return
  const fab = (event.currentTarget as HTMLElement)?.closest('.fab')
  // Only close if FAB is already open (has focus within)
  if (fab instanceof HTMLElement && fab.matches(':focus-within')) {
    event.preventDefault()
    fab.blur()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }
}
</script>

<template>
  <div
    tabindex="0"
    role="button"
    v-bind="$attrs"
    :class="{
      btn,
      'join-item': join,

      'btn-neutral': neutral || color === 'neutral',
      'btn-primary': primary || color === 'primary',
      'btn-secondary': secondary || color === 'secondary',
      'btn-accent': accent || color === 'accent',
      'btn-info': info || color === 'info',
      'btn-success': success || color === 'success',
      'btn-warning': warning || color === 'warning',
      'btn-error': error || color === 'error',

      'text-primary': (primary || color === 'primary') && link,
      'text-secondary': (secondary || color === 'secondary') && link,
      'text-neutral': (neutral || color === 'neutral') && link,
      'text-accent': (accent || color === 'accent') && link,
      'text-info': (info || color === 'info') && link,
      'text-success': (success || color === 'success') && link,
      'text-warning': (warning || color === 'warning') && link,
      'text-error': (error || color === 'error') && link,

      glass,

      'btn-circle': circle || shape === 'circle',
      'btn-square': square || shape === 'square',
      'btn-wide': wide || shape === 'wide',
      'btn-block': block || shape === 'block',

      'btn-xl': xl || size === 'xl',
      'btn-lg': lg || size === 'lg',
      'btn-md': md || size === 'md',
      'btn-sm': sm || size === 'sm',
      'btn-xs': xs || size === 'xs',

      'btn-outline': outline,
      'btn-dash': dash,
      'btn-ghost': ghost,
      'btn-soft': soft,
      'btn-link': link,

      'no-animation': noAnimation,
      'btn-active': active,
    }"
    @mousedown="handleMouseDown"
  >
    <slot />
  </div>
</template>
