<script setup lang="ts">
import IconImage from '@/components/Icon/IconImage.vue';

import type { ICategory } from 'pixelrunner-shared';

export interface Props {
  categories: ICategory[];
  hasItemsInline?: boolean;
  isInteractive?: boolean;
  hasSorting?: boolean;
}

const {
  categories,
  hasItemsInline = false,
  isInteractive = false,
  hasSorting = false
}: Props = defineProps<Props>();
</script>

<template>
  <component
    :is="hasSorting ? 'ol' : 'ul'"
    :class="['component--category-list', {
      'menu menu-horizontal': hasItemsInline,
      'md:columns-4 sm:columns-3 columns-2 gap-4': !hasItemsInline
    }]">
    <li v-for="category in categories" :key="category.key" :class="{'break-inside-avoid': !hasItemsInline}">
      <component
        :is="isInteractive ? 'router-link' : 'span'"
        :to="isInteractive ? `/library/categories/${category.key}` : undefined"
        :class="isInteractive ? 'rounded-field hover:bg-base-200 px-4 py-2' : undefined"
        class="flex"
      >
        <IconImage v-bind="category.icon" className="mr-2" />
        <span class="text-balance">{{ $t(`applet.category.${category.key}.label`) }}</span>
      </component>
    </li>
  </component>
</template>
