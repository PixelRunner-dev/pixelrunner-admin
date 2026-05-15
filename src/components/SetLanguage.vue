<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import i18next, { changeLanguage } from 'i18next';
import type { Ref } from 'vue';
import type { Resource } from 'i18next';

import { CookieStore } from '@/utils/CookieStore.ts';

const props = withDefaults(
  defineProps<{
    id?: string;
    modelValue?: string;
    name?: string;
    requireSelection?: boolean;
  }>(),
  {
    id: 'language',
    modelValue: undefined,
    name: 'language',
    requireSelection: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const fallbackLanguage = props.requireSelection ? '' : i18next.language || 'en';
const currentLanguage = ref(props.modelValue ?? CookieStore.get('language') ?? fallbackLanguage);

const languages = computed(() => {
  const resource = i18next.options.resources as Resource | undefined;
  return resource ? Object.keys(resource) : [];
});

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined && value !== currentLanguage.value) {
      currentLanguage.value = value;
    }
  }
);

function applyLanguage(value: string) {
  currentLanguage.value = value;
  void changeLanguage(value);
  CookieStore.set('language', value);
  emit('update:modelValue', value);
  emit('change', value);
}

function onLanguageChange(e: Event) {
  const target = e.target as HTMLSelectElement | null;
  const value = target?.value;
  if (value) {
    applyLanguage(value);
  }
}

function getCurrentLanguage(): Ref<string> {
  return currentLanguage;
}

defineExpose({ getCurrentLanguage });
</script>

<template>
  <select
    :id="id"
    class="select"
    :name="name"
    :value="currentLanguage"
    @change="onLanguageChange"
  >
    <option v-if="requireSelection" value="" disabled>[Choose language]</option>
    <option
      v-for="languageCode in languages"
      :key="'language-' + languageCode"
      :value="languageCode"
    >
      {{ $t('language.' + languageCode) }}
    </option>
  </select>
</template>
