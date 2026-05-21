<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import {
  Button as DButton,
  FormControl as DFormControl,
  Input as DInput,
  Join as DJoin
} from '(vendor)/daisy-ui-kit/index.ts';

const router = useRouter();
const route = useRoute();

const normalizeQuery = (value: typeof route.query.q) => {
  if (Array.isArray(value)) {
    return value.find((queryValue): queryValue is string => typeof queryValue === 'string') ?? '';
  }

  return value ?? '';
};

const query = ref(normalizeQuery(route.query.q));

watch(
  () => route.query.q,
  (newQuery) => {
    const normalizedQuery = normalizeQuery(newQuery);

    if (query.value !== normalizedQuery) {
      query.value = normalizedQuery;
    }
  }
);

watch(query, (newQuery) => {
  if (normalizeQuery(route.query.q) === newQuery) {
    return;
  }

  const routeQuery = { ...route.query };

  if (newQuery) {
    routeQuery.q = newQuery;
  } else {
    delete routeQuery.q;
  }

  router.replace({ name: 'store-search', query: routeQuery });
});
</script>

<template>
  <DJoin class="component--store-search">
    <DFormControl>
      <label class="input input-lg join-item">
        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2.5"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </g>
        </svg>
        <DInput
          id="search"
          type="search"
          name="search"
          placeholder="[Search]"
          v-model="query"
          size="lg"
          class="grow pl-0 focus:outline-none"
          autocomplete="false"
        />
      </label>
    </DFormControl>

    <DButton color="primary" size="lg" join>[Search]</DButton>
  </DJoin>
</template>

<style scoped></style>
