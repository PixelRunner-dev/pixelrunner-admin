<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';

import FormField from '../FormField.vue';
import { appletFieldComponents } from './index.ts';
import {
  appletConfigContextKey,
  type AppletConfigurationValue
} from '@/utils/applet-config-context.ts';
import { useClientApi } from '@/ws/index.ts';

import type { IAppletSchemaObject } from 'pixelrunner-shared';

import { Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

/**
 * Tidbyt "generated" schema field
 * (https://tidbyt.dev/docs/reference/schema#generated).
 *
 * The Generated field has no value of its own. When the field referenced
 * by `source` changes, the named `handler` Starlark function is invoked
 * on the device with that value, and its returned list of fields is
 * rendered in place. Returned sub-fields contribute their values to the
 * same top-level configuration dict, so the parent form can save them
 * like any other field.
 */
interface Props {
  id: string;
  source?: string;
  handler?: string;
}

const { id, source, handler } = defineProps<Props>();

const ctx = inject(appletConfigContextKey, null);
const { applets } = useClientApi();

const generated = ref<IAppletSchemaObject[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const sourceValue = computed<AppletConfigurationValue | undefined>(() => {
  if (!ctx || !source) return undefined;
  return ctx.values.value[source];
});

const isConfigured = computed(() => Boolean(ctx && handler && source));

const getFieldComponent = (item: IAppletSchemaObject) => appletFieldComponents[item.type];

const FETCH_DEBOUNCE_MS = 200;
let fetchTimer: ReturnType<typeof setTimeout> | undefined;
let fetchSeq = 0;

const cancelPendingFetch = () => {
  if (fetchTimer) {
    clearTimeout(fetchTimer);
    fetchTimer = undefined;
  }
};

const runHandler = async (value: AppletConfigurationValue | undefined) => {
  if (!ctx || !applets || !handler) return;

  // Race-guard: only the most recent request applies. Earlier in-flight
  // calls land but their result is discarded.
  const seq = ++fetchSeq;

  isLoading.value = true;
  error.value = null;

  try {
    const fields = await applets.callSchemaHandler(ctx.packageName, handler, value);

    if (seq !== fetchSeq) return;

    generated.value = fields;

    // Seed defaults for newly arrived sub-fields without clobbering any
    // value the user already typed.
    for (const field of fields) {
      ctx.ensureDefault(field.id, field.default as AppletConfigurationValue | undefined);
    }
  } catch (err) {
    if (seq !== fetchSeq) return;

    generated.value = [];
    error.value = err instanceof Error ? err.message : 'Failed to generate fields';
  } finally {
    if (seq === fetchSeq) isLoading.value = false;
  }
};

const scheduleFetch = (value: AppletConfigurationValue | undefined) => {
  cancelPendingFetch();
  fetchTimer = setTimeout(() => {
    fetchTimer = undefined;
    void runHandler(value);
  }, FETCH_DEBOUNCE_MS);
};

watch(
  sourceValue,
  (next) => {
    if (!isConfigured.value) return;
    scheduleFetch(next);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  cancelPendingFetch();
});

const onSubFieldUpdate = (subId: string, value: AppletConfigurationValue) => {
  ctx?.setValue(subId, value);
};
</script>

<template>
  <div
    class="component--field-generated"
    :data-field-id="id"
    :data-source="source"
    :data-handler="handler"
  >
    <template v-if="!isConfigured">
      <DText size="xs">
        {{ $t('applet.config.generated.misconfigured') }}
      </DText>
    </template>

    <template v-else>
      <DText v-if="isLoading" size="xs" data-testid="field-generated-loading">
        {{ $t('applet.config.generated.loading') }}
      </DText>
      <DText v-else-if="error" size="xs" data-testid="field-generated-error">
        {{ $t('applet.config.generated.error') }}
      </DText>
      <DText v-else-if="!generated.length" size="xs" data-testid="field-generated-empty">
        {{ $t('applet.config.generated.empty') }}
      </DText>

      <template v-for="item in generated" :key="item.id">
        <FormField :id="item.id" :label="item.name" :description="item.desc">
          <component
            :is="getFieldComponent(item)"
            v-if="getFieldComponent(item)"
            v-bind="item"
            :model-value="ctx?.values.value[item.id]"
            @update:model-value="
              (value: AppletConfigurationValue) => onSubFieldUpdate(item.id, value)
            "
          />
        </FormField>
      </template>
    </template>
  </div>
</template>
