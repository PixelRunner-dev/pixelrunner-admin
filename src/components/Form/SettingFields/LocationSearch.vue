<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import i18next from 'i18next';

  import {
    Input as DInput,
    LoadingSpinner as DLoadingSpinner,
  } from '(vendor)/daisy-ui-kit/index.ts';

  import type { Place } from '@/workers/search-worker.ts';

  export interface LocationResult {
    lat: string;
    lng: string;
    timezone?: string;
    locality?: string;
    desc?: string;
    place_id?: string;
  }

  interface Props {
    id: string;
    modelValue: LocationResult;
    defaultQuery?: string;
    default?: LocationResult;
  }

  const { id, defaultQuery, default: defaultValue }: Props = defineProps<Props>();

  const emit = defineEmits<{
    'update:modelValue': [value: LocationResult];
  }>();

  const query = ref(defaultValue?.desc || defaultQuery || '');
  const suggestions = ref<Place[]>([]);
  const suggestionsEl = ref<HTMLElement | null>(null);
  const isLoading = ref(false);
  const selected = ref<Place | null>(null);

  let worker: Worker | null = null;
  let debounceT: number | undefined;

  function startWorker() {
    worker = new Worker(new URL('@/workers/search-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'ready') {
        isLoading.value = false;
        return;
      }
      if (msg.type === 'results') {
        suggestions.value = msg.results || [];
        isLoading.value = false;
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error', err);
      isLoading.value = false;
    };
  }

  function doSearch(q: string) {
    if (!worker) return;
    worker.postMessage({ type: 'search', q, limit: 10 });
  }

  function onInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    query.value = v;

    if (selected.value && v.length > 0) {
      const expectedValue = `${selected.value.name}, ${getCountryName(selected.value.country)}`;
      if (v !== expectedValue) selected.value = null;
    }
    validateInput();

    clearTimeout(debounceT);
    debounceT = window.setTimeout(() => {
      if (!v || v.length < 2) {
        suggestions.value = [];
        return;
      }
      isLoading.value = true;
      doSearch(v);
    }, 250);
  }

  function validateInput() {
    const inputEl = getInputElement();
    if (!inputEl) return;

    inputEl.setCustomValidity('');
    if (!selected.value && query.value.length > 0) {
      inputEl.setCustomValidity(i18next.t('settingsPage.localization.location.error'));
    }
    inputEl.reportValidity();
  }

  function getInputElement() {
    return document.getElementById(id) as HTMLInputElement | null;
  }

  async function choose(p: Place) {
    const inputEl = getInputElement();
    if (inputEl) {
      inputEl.setCustomValidity('');
    }
    selected.value = p;
    query.value = `${p.name}, ${getCountryName(p.country)}`;
    suggestions.value = [];
    emit('update:modelValue', {
      lat: String(p.lat),
      lng: String(p.lng),
      locality: p.name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      desc: query.value
    });
  }

  function getCountryName(countryCode: string) {
    const regionNames = new Intl.DisplayNames([i18next.language], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase());
  }

  onMounted(() => {
    isLoading.value = true;
    startWorker();

    if (defaultValue) {
      emit('update:modelValue', defaultValue);
    }
  });

  onBeforeUnmount(() => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  });
</script>

<template>
  <div
    class="relative"
    @blur="suggestionsEl?.classList.add('hidden')">
    <div class="relative border border-size-field rounded-field focus-within:ring focus-within:outline-2 focus-within:outline-offset-3 bg-base-100 text-sm w-80"
      style="border-color: color-mix(in oklab, var(--color-base-content) 20%, #0000);">
      <DInput
        :id
        type="text"
        :name="id"
        class="rounded-field outline-none pl-3 pr-12 py-2 text-sm w-full"
        v-model="query"
        :placeholder="$t('settingsPage.localization.location.placeholder')"
        aria-autocomplete="list"
        aria-expanded="false"
        autocomplete="off"
        :aria-controls="`${id}-suggestions`"
        validator
        required
        @input="onInput"
        @keyup.escape="suggestions = []"
        @keyup.down="suggestions.length && suggestionsEl?.querySelector('button')?.focus()"
      />

      <DLoadingSpinner v-if="isLoading" class="absolute top-[6px] right-[6px] w-6" />
    </div>

    <div
      v-if="suggestions.length"
      ref="suggestionsEl"
      :id="`${id}-suggestions`"
      class="absolute left-0 top-12 z-10 bg-base-100 w-80 border border-size-field rounded-field pt-2 pb-0"
      style="border-color: color-mix(in oklab, var(--color-base-content) 20%, #0000);">
      <template v-for="s in suggestions" :key="s.lat+''+s.lng">
        <button
          class="block mx-1 px-[10px] py-2 hover:bg-neutral hover:text-neutral-content cursor-pointer w-full -translate-1 text-left rounded-field focus:outline-none focus:bg-neutral focus:text-neutral-content"
          @click="choose(s)"
          @keyup.escape="suggestions = []"
          @keyup.enter="choose(s)">
          {{ s.name }}, {{ getCountryName(s.country) }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
#location:placeholder-shown:not(:valid) {
  border-color: transparent;
}
</style>
