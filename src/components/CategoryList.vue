<script setup lang="ts">
import IconImage from '@/components/Icon/IconImage.vue';

import type { ICategory } from 'pixelrunner-shared';

export interface Props {
  categories: ICategory[];
  hasItemsInline?: boolean;
  isInteractive?: boolean;
  hasSorting?: boolean;
}

const { categories, hasItemsInline = false, isInteractive = false, hasSorting = false }: Props = defineProps<Props>();
</script>

<template>
  <component
    :is="hasSorting ? 'ol' : 'ul'"
    :class="['component--category-list', 'menu', { 'menu-horizontal': hasItemsInline }]"
  >
    <li v-for="category in categories" :key="category.key">
      <component
        :is="isInteractive ? 'router-link' : 'span'"
        :to="isInteractive ? `/store/categories/${category.key}` : undefined">
        <IconImage v-bind="category.icon" />
        {{ $t(`applet.category.${category.key}.label`) }}
      </component>
    </li>
  </component>
</template>
