<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'a' },
    hover: Boolean,

    color: String as () => 'neutral' | 'primary' | 'secondary' | 'accent' | 'success' | 'info' | 'warning' | 'error',
    neutral: Boolean,
    primary: Boolean,
    secondary: Boolean,
    accent: Boolean,
    success: Boolean,
    info: Boolean,
    warning: Boolean,
    error: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'link',
      {
        'link-neutral': props.neutral || props.color === 'neutral',
        'link-primary': props.primary || props.color === 'primary',
        'link-secondary': props.secondary || props.color === 'secondary',
        'link-accent': props.accent || props.color === 'accent',
        'link-success': props.success || props.color === 'success',
        'link-info': props.info || props.color === 'info',
        'link-warning': props.warning || props.color === 'warning',
        'link-error': props.error || props.color === 'error',
        'link-hover': props.hover,
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
