<script lang="ts">
import { computed, defineComponent, h, mergeProps } from 'vue'
import { resolveIs } from '../utils/resolve-is'

export default defineComponent({
  inheritAttrs: false,
  props: {
    is: { type: [String, Object], default: 'div' },
    join: Boolean,

    // https://tailwindcss.com/docs/flex
    flex: Boolean,
    flex1: Boolean,
    flexAuto: Boolean,
    flexInitial: Boolean,
    none: Boolean,

    // justify
    justify: String as () => 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly',
    justifyStart: Boolean,
    justifyEnd: Boolean,
    justifyCenter: Boolean,
    justifyBetween: Boolean,
    justifyAround: Boolean,
    justifyEvenly: Boolean,

    // align
    items: String as () => 'start' | 'end' | 'center' | 'baseline' | 'stretch',
    itemsStart: Boolean,
    itemsEnd: Boolean,
    itemsCenter: Boolean,
    itemsBaseline: Boolean,
    itemsStretch: Boolean,

    grow: Boolean,

    // https://tailwindcss.com/docs/flex-direction
    direction: String as () => 'row' | 'col' | 'row-reverse' | 'col-reverse',
    row: Boolean,
    col: Boolean,
    reverse: Boolean,

    // https://tailwindcss.com/docs/flex-wrap
    wrap: Boolean,
    nowrap: Boolean,
    wrapReverse: Boolean,
  },
  setup(props, { slots, attrs }) {
    const classes = computed(() => [
      'flex',
      {
        'join-item': props.join,

        'flex-1': props.flex1,
        'flex-auto': props.flexAuto,
        'flex-initial': props.flexInitial,
        'flex-none': props.none,

        'justify-start': props.justifyStart,
        'justify-end': props.justifyEnd,
        'justify-center': props.justifyCenter,
        'justify-between': props.justifyBetween,
        'justify-around': props.justifyAround,
        'justify-evenly': props.justifyEvenly,

        'items-start': props.itemsStart,
        'items-end': props.itemsEnd,
        'items-center': props.itemsCenter,
        'items-baseline': props.itemsBaseline,
        'items-stretch': props.itemsStretch,

        'flex-grow': props.grow,

        'flex-row': props.direction === 'row' || props.row,
        'flex-col': props.direction === 'col' || props.col,
        'flex-row-reverse': props.direction === 'row-reverse' || (props.row && props.reverse),
        'flex-col-reverse': props.direction === 'col-reverse' || (props.col && props.reverse),

        'flex-wrap': props.wrap,
        'flex-wrap-reverse': props.wrapReverse,
        'flex-nowrap': props.nowrap,
      },
    ])

    return () => h(resolveIs(props.is), mergeProps(attrs, { class: classes.value }), slots.default?.())
  },
})
</script>
