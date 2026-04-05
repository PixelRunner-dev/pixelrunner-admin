<script lang="ts">
import { computed, defineComponent, h, inject, mergeProps } from 'vue'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'label' },
    name: String,
    active: Boolean,
    disabled: Boolean,
  },
  setup(props, { slots, attrs }) {
    const tabManager: any = inject('tabManager')
    if (!tabManager.currentTab.value) {
      tabManager.currentTab.value = props.name
    }

    const classes = computed(() => [
      'tab',
      {
        'tab-active': props.active || tabManager.currentTab.value === props.name,
        'tab-disabled': props.disabled,
      },
    ])

    return () =>
      h(
        props.is as any,
        mergeProps(attrs, {
          class: classes.value,
          onKeypress: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              tabManager.currentTab.value = props.name
            }
          },
        }),
        [
          h('input', {
            type: 'radio',
            name: tabManager.name,
            value: props.name,
            checked: tabManager.currentTab.value === props.name,
            onChange: () => {
              tabManager.currentTab.value = props.name
            },
          }),
          ...(slots.default ? slots.default() : [h('span', props.name)]),
        ],
      )
  },
})
</script>
