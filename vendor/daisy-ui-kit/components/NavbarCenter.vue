<script lang="ts">
import { defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
  },
  setup(props, { slots, attrs }) {
    return () => h(resolveIs(props.is), mergeProps(attrs, { class: 'navbar-center' }), slots.default?.())
  },
})
</script>
