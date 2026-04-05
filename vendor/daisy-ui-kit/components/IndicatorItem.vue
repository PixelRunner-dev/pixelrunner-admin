<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },

    align: String as () => 'start' | 'center' | 'end',
    start: Boolean,
    center: Boolean,
    end: Boolean,

    vAlign: String as () => 'top' | 'middle' | 'bottom',
    top: Boolean,
    middle: Boolean,
    bottom: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'indicator-item',
      {
        'indicator-start': props.start || props.align === 'start',
        'indicator-center': props.center || props.align === 'center',
        'indicator-end': props.end || props.align === 'end',

        'indicator-top': props.top || props.vAlign === 'top',
        'indicator-middle': props.middle || props.vAlign === 'middle',
        'indicator-bottom': props.bottom || props.vAlign === 'bottom',
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
