<script setup lang="ts">
import { computed } from 'vue';

import { Button as DButton, Join as DJoin } from '(vendor)/daisy-ui-kit/index.ts';
import { t } from 'i18next';

interface Props {
  /** Current page, 1-based. */
  page: number;
  /** Total number of items across all pages. */
  total: number;
  /** Items per page. */
  pageSize: number;
}

const { page, total, pageSize }: Props = defineProps<Props>();
const emit = defineEmits<{
  'update:page': [page: number];
}>();

const pageCount = computed(() => Math.max(1, Math.ceil(total / pageSize)));

// ponytail: prev/next + "x of n" label; add numbered page buttons if deep paging is needed.
function go(next: number) {
  const clamped = Math.min(Math.max(1, next), pageCount.value);

  if (clamped !== page) emit('update:page', clamped);
}
</script>

<template>
  <nav v-if="pageCount > 1" class="flex justify-center my-4" :aria-label="t('pagination.label')">
    <DJoin>
      <DButton
        join
        size="sm"
        :disabled="page <= 1"
        :aria-label="t('pagination.previous')"
        @click="go(page - 1)"
      >
        «
      </DButton>
      <DButton join size="sm" class="pointer-events-none" aria-current="page">
        {{ t('pagination.status', { page, pageCount }) }}
      </DButton>
      <DButton
        join
        size="sm"
        :disabled="page >= pageCount"
        :aria-label="t('pagination.next')"
        @click="go(page + 1)"
      >
        »
      </DButton>
    </DJoin>
  </nav>
</template>
