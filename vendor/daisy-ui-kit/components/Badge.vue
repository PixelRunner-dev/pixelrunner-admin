<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
    outline: Boolean,
    soft: Boolean,
    dash: Boolean,
    ghost: Boolean,

    size: String as () => string,
    xl: Boolean,
    lg: Boolean,
    md: Boolean,
    sm: Boolean,
    xs: Boolean,

    color: String as () => string,
    neutral: Boolean,
    primary: Boolean,
    secondary: Boolean,
    accent: Boolean,
    info: Boolean,
    success: Boolean,
    warning: Boolean,
    error: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'badge',
      {
        'badge-outline': props.outline,
        'badge-ghost': props.ghost,
        'badge-soft': props.soft,
        'badge-dash': props.dash,

        'badge-xl': props.xl || props.size === 'xl',
        'badge-lg': props.lg || props.size === 'lg',
        'badge-md': props.md || props.size === 'md',
        'badge-sm': props.sm || props.size === 'sm',
        'badge-xs': props.xs || props.size === 'xs',

        'badge-neutral': props.neutral || props.color === 'neutral',
        'badge-primary': props.primary || props.color === 'primary',
        'badge-secondary': props.secondary || props.color === 'secondary',
        'badge-accent': props.accent || props.color === 'accent',
        'badge-info': props.info || props.color === 'info',
        'badge-success': props.success || props.color === 'success',
        'badge-warning': props.warning || props.color === 'warning',
        'badge-error': props.error || props.color === 'error',
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
