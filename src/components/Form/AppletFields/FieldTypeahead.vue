<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { appletConfigContextKey } from '@/utils/applet-config-context.ts';
import { useClientApi } from '@/ws/index.ts';

import type { ITypeaheadOption } from '@/ws/api/applets.ts';

import { Flex as DFlex, Input as DInput, Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

/**
 * Tidbyt "typeahead" schema field
 * (https://tidbyt.dev/docs/reference/schema#typeahead).
 *
 * A text input whose suggestions are produced by a Starlark `handler`
 * function on the device. The user must pick one of the returned
 * options to set the field's value. Behaviour matches Tidbyt:
 * - the input text is the live query;
 * - typing triggers a debounced handler call;
 * - the dropdown shows option.display strings;
 * - selecting an option stores option.value as the field value.
 */
interface Props {
  id: string;
  handler?: string;
  default?: string;
  placeholder?: string;
}

const { id, handler, default: defaultValue, placeholder } = defineProps<Props>();
const modelValue = defineModel<string>();

const ctx = inject(appletConfigContextKey, null);
const { applets } = useClientApi();

const FETCH_DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 1;

const query = ref<string>(stringifyInitialValue(modelValue.value ?? defaultValue));
const lastPicked = ref<ITypeaheadOption | null>(null);
const options = ref<ITypeaheadOption[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
const hasError = ref(false);
const highlightedIndex = ref(-1);

const rootRef = ref<HTMLElement | null>(null);
const listboxId = `${id}-listbox`;

function focusInput() {
  rootRef.value?.querySelector<HTMLInputElement>('input')?.focus();
}

const isConfigured = computed(() => Boolean(handler && ctx));
const hasOptions = computed(() => options.value.length > 0);
const activeOptionId = computed(() =>
  highlightedIndex.value >= 0 ? `${id}-option-${highlightedIndex.value}` : undefined
);

let fetchTimer: ReturnType<typeof setTimeout> | undefined;
let fetchSeq = 0;
let outsideClickHandler: ((event: MouseEvent) => void) | undefined;

function stringifyInitialValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function cancelPendingFetch() {
  if (fetchTimer) {
    clearTimeout(fetchTimer);
    fetchTimer = undefined;
  }
}

async function fetchOptions(value: string) {
  if (!ctx || !applets || !handler) return;
  if (value.length < MIN_QUERY_LENGTH) {
    options.value = [];
    isOpen.value = false;
    return;
  }

  const seq = ++fetchSeq;

  isLoading.value = true;
  hasError.value = false;

  try {
    const result = await applets.callTypeaheadHandler(ctx.packageName, handler, value);

    if (seq !== fetchSeq) return;

    options.value = result;
    highlightedIndex.value = result.length > 0 ? 0 : -1;
    isOpen.value = true;
  } catch {
    if (seq !== fetchSeq) return;

    options.value = [];
    hasError.value = true;
    isOpen.value = true;
  } finally {
    if (seq === fetchSeq) isLoading.value = false;
  }
}

function scheduleFetch(value: string) {
  cancelPendingFetch();
  fetchTimer = setTimeout(() => {
    fetchTimer = undefined;
    void fetchOptions(value);
  }, FETCH_DEBOUNCE_MS);
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  query.value = value;

  // Diverged from the last picked option → invalidate the stored value
  // so the user must pick again. Tidbyt typeahead requires a selection.
  if (lastPicked.value && lastPicked.value.display !== value) {
    modelValue.value = '';
    lastPicked.value = null;
  }

  scheduleFetch(value);
}

function selectOption(option: ITypeaheadOption) {
  lastPicked.value = option;
  query.value = option.display;
  modelValue.value = typeof option.value === 'string' ? option.value : JSON.stringify(option.value);
  options.value = [];
  isOpen.value = false;
  highlightedIndex.value = -1;
  focusInput();
}

function onKeydown(event: KeyboardEvent) {
  if (!isConfigured.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen.value && query.value.length >= MIN_QUERY_LENGTH) {
        scheduleFetch(query.value);
        return;
      }
      if (hasOptions.value) {
        highlightedIndex.value = (highlightedIndex.value + 1) % options.value.length;
      }
      return;

    case 'ArrowUp':
      event.preventDefault();
      if (hasOptions.value) {
        highlightedIndex.value =
          highlightedIndex.value <= 0 ? options.value.length - 1 : highlightedIndex.value - 1;
      }
      return;

    case 'Enter': {
      const selected = options.value[highlightedIndex.value];
      if (isOpen.value && selected) {
        event.preventDefault();
        selectOption(selected);
      }
      return;
    }

    case 'Escape':
      if (isOpen.value) {
        event.preventDefault();
        isOpen.value = false;
        highlightedIndex.value = -1;
      }
      return;
  }
}

function onFocus() {
  if (!isConfigured.value || query.value.length < MIN_QUERY_LENGTH) return;
  if (hasOptions.value) {
    isOpen.value = true;
  } else {
    scheduleFetch(query.value);
  }
}

function onBlur() {
  // Defer so an option click can complete before the dropdown closes.
  setTimeout(() => {
    isOpen.value = false;
  }, 120);
}

function attachOutsideHandler() {
  outsideClickHandler = (event) => {
    if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
      isOpen.value = false;
      highlightedIndex.value = -1;
    }
  };
  document.addEventListener('mousedown', outsideClickHandler);
}

attachOutsideHandler();

// Keep the query string in sync if the parent rewrites modelValue
// (for example when loading saved config after mount).
watch(
  () => modelValue.value,
  (next) => {
    if (typeof next !== 'string' && typeof next !== 'number' && typeof next !== 'boolean') {
      return;
    }
    const text = String(next);
    if (lastPicked.value?.display === query.value) return;
    if (text && text !== query.value) {
      query.value = text;
    }
  }
);

onBeforeUnmount(() => {
  cancelPendingFetch();
  if (outsideClickHandler) {
    document.removeEventListener('mousedown', outsideClickHandler);
  }
});

// When options arrive, scroll the highlighted one into view.
watch([options, highlightedIndex], async () => {
  await nextTick();
  if (!rootRef.value || highlightedIndex.value < 0) return;
  const el = rootRef.value.querySelector<HTMLElement>(
    `[id="${id}-option-${highlightedIndex.value}"]`
  );
  el?.scrollIntoView?.({ block: 'nearest' });
});
</script>

<template>
  <div
    ref="rootRef"
    class="component--field-typeahead relative"
    :data-field-id="id"
    :data-handler="handler"
  >
    <DFlex>
      <DInput
        :id
        type="text"
        autocomplete="off"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="activeOptionId"
        :placeholder="placeholder"
        :value="query"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
    </DFlex>

    <ul
      v-show="isOpen && isConfigured"
      :id="listboxId"
      role="listbox"
      class="typeahead-listbox"
      data-testid="typeahead-listbox"
    >
      <li v-if="isLoading" class="typeahead-status" data-testid="typeahead-loading">
        <DText size="xs">{{ $t('applet.config.typeahead.loading') }}</DText>
      </li>
      <li v-else-if="hasError" class="typeahead-status" data-testid="typeahead-error">
        <DText size="xs">{{ $t('applet.config.typeahead.error') }}</DText>
      </li>
      <li v-else-if="!hasOptions" class="typeahead-status" data-testid="typeahead-empty">
        <DText size="xs">{{ $t('applet.config.typeahead.empty') }}</DText>
      </li>
      <li
        v-else
        v-for="(option, index) in options"
        :key="`${option.display}-${index}`"
        :id="`${id}-option-${index}`"
        role="option"
        :aria-selected="index === highlightedIndex"
        class="typeahead-option"
        :class="{ 'typeahead-option-active': index === highlightedIndex }"
        data-testid="typeahead-option"
        @mousedown.prevent="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        {{ option.display }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.typeahead-listbox {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 16rem;
  overflow-y: auto;
  list-style: none;
  background: var(--color-base-100, #fff);
  border: 1px solid var(--color-base-300, #e5e7eb);
  border-radius: 0.5rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}
.typeahead-option {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.typeahead-option-active {
  background: var(--color-base-200, #f3f4f6);
}
.typeahead-status {
  padding: 0.5rem 0.75rem;
  opacity: 0.7;
}
</style>
