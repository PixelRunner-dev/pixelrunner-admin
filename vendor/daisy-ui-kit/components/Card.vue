<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
    border: Boolean,
    dash: Boolean,
    side: Boolean,
    imageFull: Boolean,
    size: String as () => 'xl' | 'lg' | 'md' | 'sm' | 'xs',
    xl: Boolean,
    lg: Boolean,
    md: Boolean,
    sm: Boolean,
    xs: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'card',
      {
        'card-border': props.border,
        'card-side': props.side,
        'image-full': props.imageFull,

        'card-xl': props.xl || props.size === 'xl',
        'card-lg': props.lg || props.size === 'lg',
        'card-md': props.md || props.size === 'md',
        'card-sm': props.sm || props.size === 'sm',
        'card-xs': props.xs || props.size === 'xs',
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
