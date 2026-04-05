<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'span' },
    join: Boolean,

    block: Boolean,
    inline: Boolean,
    inlineBlock: Boolean,
    label: Boolean,

    color: String as () =>
      | 'neutral'
      | 'primary'
      | 'secondary'
      | 'accent'
      | 'info'
      | 'success'
      | 'warning'
      | 'error'
      | 'primary-content'
      | 'secondary-content'
      | 'neutral-content'
      | 'accent-content'
      | 'info-content'
      | 'success-content'
      | 'warning-content'
      | 'error-content',
    neutral: Boolean,
    primary: Boolean,
    secondary: Boolean,
    accent: Boolean,
    info: Boolean,
    success: Boolean,
    warning: Boolean,
    error: Boolean,
    neutralContent: Boolean,
    primaryContent: Boolean,
    secondaryContent: Boolean,
    accentContent: Boolean,
    infoContent: Boolean,
    successContent: Boolean,
    warningContent: Boolean,
    errorContent: Boolean,

    size: String as () =>
      | '9xl'
      | '8xl'
      | '7xl'
      | '6xl'
      | '5xl'
      | '4xl'
      | '3xl'
      | '2xl'
      | 'xl'
      | 'lg'
      | 'md'
      | 'sm'
      | 'xs',
    xl: Boolean,
    lg: Boolean,
    md: Boolean,
    sm: Boolean,
    xs: Boolean,

    align: String as () => 'left' | 'center' | 'right' | 'justify',
    left: Boolean,
    center: Boolean,
    right: Boolean,
    justify: Boolean,

    case: String as () => 'upper' | 'lower' | 'capitalize' | 'normal',
    uppercase: Boolean,
    lowercase: Boolean,
    capitalize: Boolean,
    normalCase: Boolean,

    font: String as () => 'sans' | 'serif' | 'mono',
    sans: Boolean,
    serif: Boolean,
    mono: Boolean,

    weight: String as () =>
      | 'thin'
      | 'extralight'
      | 'light'
      | 'normal'
      | 'medium'
      | 'semibold'
      | 'bold'
      | 'extrabold'
      | 'black',
    thin: Boolean,
    extralight: Boolean,
    light: Boolean,
    normal: Boolean,
    medium: Boolean,
    semibold: Boolean,
    bold: Boolean,
    extrabold: Boolean,
    black: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => ({
      'join-item': props.join,

      block: props.block,
      inline: props.inline,
      'inline-block': props.inlineBlock,
      label: props.label,

      'text-primary': props.primary || props.color === 'primary',
      'text-primary-content': props.primaryContent || props.color === 'primary-content',
      'text-secondary': props.secondary || props.color === 'secondary',
      'text-secondary-content': props.secondaryContent || props.color === 'secondary-content',
      'text-neutral': props.neutral || props.color === 'neutral',
      'text-neutral-content': props.neutralContent || props.color === 'neutral-content',
      'text-accent': props.accent || props.color === 'accent',
      'text-accent-content': props.accentContent || props.color === 'accent-content',
      'text-info': props.info || props.color === 'info',
      'text-info-content': props.infoContent || props.color === 'info-content',
      'text-success': props.success || props.color === 'success',
      'text-success-content': props.successContent || props.color === 'success-content',
      'text-warning': props.warning || props.color === 'warning',
      'text-warning-content': props.warningContent || props.color === 'warning-content',
      'text-error': props.error || props.color === 'error',
      'text-error-content': props.errorContent || props.color === 'error-content',

      'text-9xl': props.size === '9xl',
      'text-8xl': props.size === '8xl',
      'text-7xl': props.size === '7xl',
      'text-6xl': props.size === '6xl',
      'text-5xl': props.size === '5xl',
      'text-4xl': props.size === '4xl',
      'text-3xl': props.size === '3xl',
      'text-2xl': props.size === '2xl',
      'text-xl': props.xl || props.size === 'xl',
      'text-lg': props.lg || props.size === 'lg',
      'text-md': props.md || props.size === 'md',
      'text-sm': props.sm || props.size === 'sm',
      'text-xs': props.xs || props.size === 'xs',

      'text-left': props.left || props.align === 'left',
      'text-center': props.center || props.align === 'center',
      'text-right': props.right || props.align === 'right',
      'text-justify': props.justify || props.align === 'justify',

      uppercase: props.uppercase || props.case === 'upper',
      lowercase: props.lowercase || props.case === 'lower',
      capitalize: props.capitalize || props.case === 'capitalize',
      'normal-case': props.normalCase || props.case === 'normal',

      'font-sans': props.sans || props.font === 'sans',
      'font-serif': props.serif || props.font === 'serif',
      'font-mono': props.mono || props.font === 'mono',

      'font-thin': props.thin || props.weight === 'thin',
      'font-extralight': props.extralight || props.weight === 'extralight',
      'font-light': props.light || props.weight === 'light',
      'font-normal': props.normal || props.weight === 'normal',
      'font-medium': props.medium || props.weight === 'medium',
      'font-semibold': props.semibold || props.weight === 'semibold',
      'font-bold': props.bold || props.weight === 'bold',
      'font-extrabold': props.extrabold || props.weight === 'extrabold',
      'font-black': props.black || props.weight === 'black',
    }))

    return () =>
      h(
        resolveIs(props.is),
        mergeProps(attrs, { ...(props.label ? { 'data-role': 'label' } : {}), class: classes.value }),
        slots.default?.(),
      )
  },
})
</script>
