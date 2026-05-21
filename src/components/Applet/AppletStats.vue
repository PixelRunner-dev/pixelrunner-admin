<script setup lang="ts">
interface Props {
  packageName: string;
}

const { packageName }: Props = defineProps<Props>();

// fetch to get by 'packageName'
// detailPageViews?: number;
// likes?: number;
// totalInstalls?: number;
</script>

<template>
  <aside class="component--applet-stats">
    <p>Detail page views: {{ detailPageViews }}</p>
    <p>Likes: {{ likes }}</p>
    <p>Total installs: {{ totalInstalls }}</p>
  </aside>
</template>
