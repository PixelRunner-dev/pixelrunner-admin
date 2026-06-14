<script setup lang="ts">
import LibrarySearch from '@/components/Library/LibrarySearch.vue';
</script>

<template>
  <main>
    <h1>{{ $t('searchPage.title') }}</h1>
    <LibrarySearch />
    <p>{{ $t('searchPage.searchingFor', { query: $route.query.q }) }}</p>
  </main>
</template>

<style scoped></style>
