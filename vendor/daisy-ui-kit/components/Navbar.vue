<script lang="ts">
import { defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
    glass: { type: Boolean, default: false },
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(resolveIs(props.is), mergeProps(attrs, { class: ['navbar', { glass: props.glass }] }), slots.default?.())
  },
})
</script>
