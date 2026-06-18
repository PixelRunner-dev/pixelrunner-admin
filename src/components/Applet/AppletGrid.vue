<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppletCard from '@/components/Applet/AppletCard.vue';
import AppletList from '@/components/Applet/AppletList.vue';
import PaginationNavigation from '@/components/PaginationNavigation.vue';

import type { IFullApplet } from 'pixelrunner-shared';

interface Props {
  applets: IFullApplet[];
  pageSize?: number;
}

const { applets, pageSize = 20 }: Props = defineProps<Props>();

const route = useRoute();
const router = useRouter();

const pageCount = computed(() => Math.max(1, Math.ceil(applets.length / pageSize)));

// Current page is driven by the `?page=` query param so it is deep-linkable and
// survives reloads. The setter writes it back (omitting `page=1` to keep URLs clean).
// ponytail: a stale ?page beyond the range just clamps for display; the URL is
// rewritten as soon as the user paginates.
const page = computed({
  get() {
    const raw = Number(route.query.page);

    if (!Number.isInteger(raw) || raw < 1) return 1;

    return Math.min(raw, pageCount.value);
  },
  set(value) {
    const clamped = Math.min(Math.max(1, value), pageCount.value);
    const query = { ...route.query };

    if (clamped > 1) query.page = String(clamped);
    else delete query.page;

    void router.replace({ query });
  }
});

const offset = computed(() => (page.value - 1) * pageSize);
</script>

<template>
  <div class="component--applet-grid my-4">
    <AppletList
      :applets
      :limit="pageSize"
      :offset
      :classes="{
        list: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
        item: 'grid__item block'
      }"
    >
      <template #item="applet">
        <AppletCard view="vertical" :applet />
      </template>
    </AppletList>

    <PaginationNavigation v-model:page="page" :total="applets.length" :page-size="pageSize" />
  </div>
</template>
