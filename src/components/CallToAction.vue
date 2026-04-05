<script setup lang="ts">
import type { ButtonHTMLAttributes } from 'vue';

export interface Props extends /* @vue-ignore */ ButtonHTMLAttributes {
  variant?: Variants;
  size?: Sizes;
  loading?: boolean;
}

type Variants = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' | 'tag';
type Sizes = 'small' | 'default' | 'large';

const { variant = 'secondary', size = 'default', loading = false }: Props = defineProps<Props>();
</script>

<template>
  <button
    :class="[
      'component--call-to-action',
      `call-to-action--variant-${variant}`,
      `call-to-action--size-${size}`,
      { 'is-loading': loading }
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
