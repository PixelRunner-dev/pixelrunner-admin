<script setup lang="ts">
import StoreSearch from '@/components/Store/StoreSearch.vue';
</script>

<template>
  <main>
    <h1>Store Search</h1>
    <StoreSearch />
    <p>Searching for: {{ $route.query.q }}</p>
  </main>
</template>

<style scoped></style>
