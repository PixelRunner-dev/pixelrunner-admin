<script setup lang="ts">
import { computed } from 'vue'
import Mask from './Mask.vue'

const props = defineProps({
  backgroundColor: { type: String, default: '#BBB' },
  maskClasses: String,
  showStatus: Boolean,
  // Presence props
  presence: String,
  online: Boolean,
  offline: Boolean,
  // Mask shape props (self-contained, no Mask.config.ts dependency)
  shape: String,
  squircle: Boolean,
  heart: Boolean,
  hexagon: Boolean,
  hexagon2: Boolean,
  decagon: Boolean,
  pentagon: Boolean,
  diamond: Boolean,
  square: Boolean,
  circle: Boolean,
  star: Boolean,
  star2: Boolean,
  triangle: Boolean,
  triangle2: Boolean,
  triangle3: Boolean,
  triangle4: Boolean,
  half1: Boolean,
  half2: Boolean,
})

const maskShapeKeys = [
  'mask-squircle',
  'mask-heart',
  'mask-hexagon',
  'mask-hexagon-2',
  'mask-decagon',
  'mask-pentagon',
  'mask-diamond',
  'mask-square',
  'mask-circle',
  'mask-star',
  'mask-star-2',
  'mask-triangle',
  'mask-triangle-2',
  'mask-triangle-3',
  'mask-triangle-4',
  'mask-half-1',
  'mask-half-2',
] as const

type AvatarClassKey = (typeof maskShapeKeys)[number] | 'rounded-box' | 'avatar-online' | 'avatar-offline'

const avatarClasses = computed<Record<AvatarClassKey, boolean>>(() => {
  const mask: Record<AvatarClassKey, boolean> = {
    'mask-squircle': props.squircle || props.shape === 'squircle',
    'mask-heart': props.heart || props.shape === 'heart',
    'mask-hexagon': props.hexagon || props.shape === 'hexagon',
    'mask-hexagon-2': props.hexagon2 || props.shape === 'hexagon-2',
    'mask-decagon': props.decagon || props.shape === 'decagon',
    'mask-pentagon': props.pentagon || props.shape === 'pentagon',
    'mask-diamond': props.diamond || props.shape === 'diamond',
    'mask-square': props.square || props.shape === 'square',
    'mask-circle': props.circle || props.shape === 'circle',
    'mask-star': props.star || props.shape === 'star',
    'mask-star-2': props.star2 || props.shape === 'star-2',
    'mask-triangle': props.triangle || props.shape === 'triangle',
    'mask-triangle-2': props.triangle2 || props.shape === 'triangle-2',
    'mask-triangle-3': props.triangle3 || props.shape === 'triangle-3',
    'mask-triangle-4': props.triangle4 || props.shape === 'triangle-4',
    'mask-half-1': props.half1 || props.shape === 'half-1',
    'mask-half-2': props.half2 || props.shape === 'half-2',
    'rounded-box': false,
    'avatar-online': props.presence === 'online' || props.online,
    'avatar-offline': props.presence === 'offline' || props.offline,
  }
  const hasMask = maskShapeKeys.some(k => mask[k])
  mask['rounded-box'] = !hasMask
  return mask
})

const color = computed(() => {
  return `#${contrastingColor(props.backgroundColor.replace('#', ''))}`
})

function contrastingColor(color: any) {
  return luma(color) >= 155 ? '000' : 'fff'
}
// color can be a hx string or an array of RGB values 0-255
function luma(color: any) {
  const rgb = typeof color === 'string' ? hexToRGBArray(color) : color
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] // SMPTE C, Rec. 709 weightings
}
function hexToRGBArray(color: any) {
  if (color.length === 3) {
    color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2)
  } else if (color.length !== 6) {
    throw new Error(`Invalid hex color: ${color}`)
  }
  const rgb = []
  for (let i = 0; i <= 2; i++) {
    rgb[i] = Number.parseInt(color.substr(i * 2, 2), 16)
  }
  return rgb
}
</script>

<template>
  <div class="avatar">
    <Mask
      :style="{ backgroundColor, color }"
      class="w-full h-full avatar-mask aspect-square"
      :class="[avatarClasses, maskClasses]"
    >
      <slot />
    </Mask>
  </div>
</template>

<style lang="postcss">
.avatar-mask > * {
  aspect-ratio: 1/1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
