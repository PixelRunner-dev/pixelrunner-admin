<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
    direction: String as () => 'top' | 'end' | 'bottom' | 'start',
    top: Boolean,
    end: Boolean,
    bottom: Boolean,
    start: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'stack',
      {
        'stack-top': props.top || props.direction === 'top',
        'stack-end': props.end || props.direction === 'end',
        'stack-bottom': props.bottom || props.direction === 'bottom',
        'stack-start': props.start || props.direction === 'start',
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
