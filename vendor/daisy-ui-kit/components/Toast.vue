<script setup lang="ts">
import type { Toast } from '../composables/use-toast'
import { computed } from 'vue'
import { useToast } from '../composables/use-toast'

// Explicit slot typing (Vue 3.4+ / Volar)
interface ToastSlotProps {
  toast?: Toast
  removeToast?: (id: number) => void
  [key: string]: unknown
}
const props = defineProps<{
  /**
   * Horizontal alignment (start, center, end)
   */
  hAlign?: 'start' | 'center' | 'end'
  start?: boolean
  center?: boolean
  end?: boolean
  /**
   * Vertical alignment (top, middle, bottom)
   */
  vAlign?: 'top' | 'middle' | 'bottom'
  top?: boolean
  middle?: boolean
  bottom?: boolean
  /**
   * Toast channel name (for named channels)
   */
  name?: string
  /**
   * Default toast settings for this channel (merged into every toast)
   * Example: { duration: 6000, type: 'info', position: 'top-center' }
   */
  defaults?: Partial<Toast>
}>()

defineSlots<{
  default: (props: ToastSlotProps) => any
}>()

// Extract useToast options from props (name, defaults, future-proof)
const toastOptions = computed(() => {
  const { name, defaults } = props
  return { name, defaults }
})

const { toasts, removeToast } = useToast(toastOptions.value)
const visibleToasts = computed(() => toasts.value ?? [])
</script>

<template>
  <div
    class="toast"
    :class="{
      'toast-start': props.start || props.hAlign === 'start',
      'toast-center': props.center || props.hAlign === 'center',
      'toast-end': props.end || props.hAlign === 'end',
      'toast-top': props.top || props.vAlign === 'top',
      'toast-middle': props.middle || props.vAlign === 'middle',
      'toast-bottom': props.bottom || props.vAlign === 'bottom',
    }"
  >
    <slot v-for="toast in visibleToasts" :key="toast.id" :toast="toast" :remove-toast="removeToast" />
    <slot />
  </div>
</template>
