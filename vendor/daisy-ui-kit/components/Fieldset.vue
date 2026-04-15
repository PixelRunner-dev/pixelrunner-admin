<script lang="ts">
import { defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'fieldset' },
    legend: String,
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        resolveIs(props.is),
        mergeProps(attrs, { class: 'fieldset bg-base-200 rounded-box p-4' }),
        [props.legend ? h('legend', { class: 'fieldset-legend' }, props.legend) : slots.legend?.(), slots.default?.()],
      )
  },
})
</script>
