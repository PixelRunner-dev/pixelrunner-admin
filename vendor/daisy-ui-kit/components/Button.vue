<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: String,
    join: Boolean,

    color: String as () => string,
    neutral: Boolean,
    primary: Boolean,
    secondary: Boolean,
    accent: Boolean,
    info: Boolean,
    success: Boolean,
    warning: Boolean,
    error: Boolean,

    ghost: Boolean,
    link: Boolean,
    glass: Boolean,
    outline: Boolean,
    dash: Boolean,
    soft: Boolean,
    disabled: Boolean,

    shape: String as () => 'circle' | 'square' | 'wide' | 'block',
    circle: Boolean,
    square: Boolean,
    wide: Boolean,
    block: Boolean,

    noAnimation: Boolean,
    active: Boolean,

    size: String as () => 'lg' | 'md' | 'sm' | 'xs' | 'xl',
    xl: Boolean,
    lg: Boolean,
    md: Boolean,
    sm: Boolean,
    xs: Boolean,

    type: { type: String as () => 'button' | 'submit' | 'reset', default: 'button' },
  },
  setup(props, { slots, attrs }) {
    const isButton = computed(() => (props.is || 'button') === 'button')

    const classes = computed(() => [
      'btn',
      {
        'join-item': props.join,

        'btn-neutral': !props.disabled && (props.neutral || props.color === 'neutral'),
        'btn-primary': !props.disabled && (props.primary || props.color === 'primary'),
        'btn-secondary': !props.disabled && (props.secondary || props.color === 'secondary'),
        'btn-accent': !props.disabled && (props.accent || props.color === 'accent'),
        'btn-info': !props.disabled && (props.info || props.color === 'info'),
        'btn-success': !props.disabled && (props.success || props.color === 'success'),
        'btn-warning': !props.disabled && (props.warning || props.color === 'warning'),
        'btn-error': !props.disabled && (props.error || props.color === 'error'),

        'text-primary': !props.disabled && (props.primary || props.color === 'primary') && props.link,
        'text-secondary': !props.disabled && (props.secondary || props.color === 'secondary') && props.link,
        'text-neutral': !props.disabled && (props.neutral || props.color === 'neutral') && props.link,
        'text-accent': !props.disabled && (props.accent || props.color === 'accent') && props.link,
        'text-info': !props.disabled && (props.info || props.color === 'info') && props.link,
        'text-success': !props.disabled && (props.success || props.color === 'success') && props.link,
        'text-warning': !props.disabled && (props.warning || props.color === 'warning') && props.link,
        'text-error': !props.disabled && (props.error || props.color === 'error') && props.link,

        glass: !props.disabled && props.glass,

        'btn-circle': props.circle || props.shape === 'circle',
        'btn-square': props.square || props.shape === 'square',
        'btn-wide': props.wide || props.shape === 'wide',
        'btn-block': props.block || props.shape === 'block',

        'btn-xl': props.xl || props.size === 'xl',
        'btn-lg': props.lg || props.size === 'lg',
        'btn-md': props.md || props.size === 'md',
        'btn-sm': props.sm || props.size === 'sm',
        'btn-xs': props.xs || props.size === 'xs',

        'btn-outline': !props.disabled && props.outline,
        'btn-dash': !props.disabled && props.dash,
        'btn-ghost': !props.disabled && props.ghost,
        'btn-soft': !props.disabled && props.soft,
        'btn-link': !props.disabled && props.link,
        'btn-disabled': props.disabled,

        'no-animation': props.noAnimation,
        'btn-active': !props.disabled && props.active,
      },
    ])

    function onKeydown(e: KeyboardEvent) {
      if (props.disabled) return
      if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        ;(e.currentTarget as HTMLElement)?.click?.()
      }
    }

    return () => {
      const tag = props.is ? resolveIs(props.is) : 'button'
      const isBtnEl = isButton.value

      return h(
        tag as any,
        mergeProps(attrs, {
          type: isBtnEl ? props.type : undefined,
          disabled: isBtnEl && props.disabled ? true : undefined,
          'aria-disabled': !isBtnEl && props.disabled ? true : undefined,
          tabindex: !isBtnEl ? (props.disabled ? -1 : 0) : undefined,
          role: !isBtnEl ? 'button' : undefined,
          class: classes.value,
          onKeydown: !isBtnEl ? onKeydown : undefined,
        }),
        slots.default?.(),
      )
    }
  },
})
</script>
