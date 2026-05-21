<script setup lang="ts">
import LibrarySearch from '@/components/Library/LibrarySearch.vue';
</script>

<template>
  <main>
    <h1>Library Search</h1>
    <LibrarySearch />
    <p>Searching for: {{ $route.query.q }}</p>
  </main>
</template>

<style scoped></style>
