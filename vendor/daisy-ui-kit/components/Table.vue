<script setup lang="ts">
defineProps<{
  zebra?: boolean
  pinRows?: boolean
  pinCols?: boolean

  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  xs?: boolean
  sm?: boolean
  md?: boolean
  lg?: boolean
  xl?: boolean
}>()
</script>

<template>
  <table
    class="table"
    :class="[
      zebra ? 'table-zebra' : '',
      pinRows ? 'table-pin-rows' : '',
      pinCols ? 'table-pin-cols' : '',
      xs || size === 'xs' ? 'table-xs' : '',
      sm || size === 'sm' ? 'table-sm' : '',
      md || size === 'md' || (!xs && !sm && !lg && !xl && !size) ? 'table-md' : '',
      lg || size === 'lg' ? 'table-lg' : '',
      xl || size === 'xl' ? 'table-xl' : '',
    ]"
  >
    <slot />
  </table>
</template>
