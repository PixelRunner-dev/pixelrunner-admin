<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';

import FormField from '../Form/FormField.vue';
import FieldSchedule from '../Form/AppletFields/FieldSchedule.vue';

import { useClientApi } from '@/ws/index.ts';

import type { Component } from 'vue';
import type { IAppletSchema, IAppletSchemaObject, IFullApplet } from 'pixelrunner-shared';

import {
  Button as DButton,
  Divider as DDivider,
  Flex as DFlex
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  applet: IFullApplet;
}

const { applet }: Props = defineProps<Props>();

const { isConnected, applets } = useClientApi();

type AppletSchemaValue = IAppletSchemaObject['default'];
type RawAppletSchemaItem = IAppletSchemaObject & {
  desc?: string;
};

const fieldComponents: Partial<Record<IAppletSchemaObject['type'], Component>> = {
  color: defineAsyncComponent(() => import('../Form/AppletFields/FieldColor.vue')),
  datetime: defineAsyncComponent(() => import('../Form/AppletFields/FieldDatetime.vue')),
  dropdown: defineAsyncComponent(() => import('../Form/AppletFields/FieldDropdown.vue')),
  generated: defineAsyncComponent(() => import('../Form/AppletFields/FieldGenerated.vue')),
  location: defineAsyncComponent(() => import('../Form/AppletFields/FieldLocation.vue')),
  locationbased: defineAsyncComponent(() => import('../Form/AppletFields/FieldLocationbased.vue')),
  oauth2: defineAsyncComponent(() => import('../Form/AppletFields/FieldOauth2.vue')),
  photoselect: defineAsyncComponent(() => import('../Form/AppletFields/FieldPhotoselect.vue')),
  text: defineAsyncComponent(() => import('../Form/AppletFields/FieldText.vue')),
  onoff: defineAsyncComponent(() => import('../Form/AppletFields/FieldOnoff.vue')),
  typeahead: defineAsyncComponent(() => import('../Form/AppletFields/FieldTypeahead.vue'))
};

const appletSchema = ref<IAppletSchema | null>(null);
const schemaError = ref<string | null>(null);
const isSchemaLoading = ref(false);

const schemaItems = computed(() => appletSchema.value?.schema ?? []);
const hasSchemaItems = computed(() => schemaItems.value.length > 0);

const isAppletSchemaItem = (item: unknown): item is RawAppletSchemaItem => {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Partial<RawAppletSchemaItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    candidate.type in fieldComponents
  );
};

const getAppliedConfigurationValue = (item: IAppletSchemaObject): AppletSchemaValue | undefined => {
  const appliedConfigurations = applet.installationDetails?.appliedConfigurations;

  if (!applet.isInstalled || !appliedConfigurations) {
    return undefined;
  }

  const config = appliedConfigurations.config
    ?? (appliedConfigurations as unknown as Record<string, AppletSchemaValue>);

  return config[item.id] as AppletSchemaValue | undefined;
};

const normalizeDefaultValue = (
  item: RawAppletSchemaItem,
  value: AppletSchemaValue | undefined
): AppletSchemaValue | undefined => {
  if (item.type !== 'onoff') return value;
  if (value === undefined) return false;
  if (typeof value === 'string') return value.toLowerCase() === 'true';

  return Boolean(value);
};

const normalizeSchemaItem = (item: RawAppletSchemaItem): IAppletSchemaObject => ({
  ...item,
  description: item.description ?? item.desc ?? '',
  default: normalizeDefaultValue(item, getAppliedConfigurationValue(item) ?? item.default)
});

const parseSchemaResponse = (schemaResponse: unknown): IAppletSchema | null => {
  if (schemaResponse === null || schemaResponse === undefined || schemaResponse === 'null') {
    return null;
  }

  if (typeof schemaResponse === 'string') {
    try {
      return parseSchemaResponse(JSON.parse(schemaResponse));
    } catch {
      return null;
    }
  }

  if (typeof schemaResponse !== 'object' || !('schema' in schemaResponse)) {
    return null;
  }

  const candidate = schemaResponse as { version?: unknown; notifications?: unknown; schema?: unknown };

  return {
    version: typeof candidate.version === 'string' ? candidate.version : '1',
    notifications: [],
    schema: Array.isArray(candidate.schema)
      ? candidate.schema.filter(isAppletSchemaItem).map(normalizeSchemaItem)
      : []
  };
};

const getFieldComponent = (item: IAppletSchemaObject) => fieldComponents[item.type];

const loadAppletSchema = async () => {
  if (!isConnected.value || !applets) return;

  isSchemaLoading.value = true;
  schemaError.value = null;

  try {
    appletSchema.value = parseSchemaResponse(await applets.getSchema(applet.packageName));
  } catch (error) {
    appletSchema.value = null;
    console.error('Failed to load applet schema', error);
    schemaError.value = 'Configuration schema unavailable.';
  } finally {
    isSchemaLoading.value = false;
  }
};

watch(
  () => [isConnected.value, applet.packageName],
  () => {
    void loadAppletSchema();
  },
  { immediate: true }
);
</script>

<template>
<div class="component--applet-config">
  <form>
    <template v-if="isSchemaLoading">...</template>
    <template v-else-if="schemaError">
      {{ schemaError }}
    </template>
    <template v-else-if="hasSchemaItems">
      <DDivider vertical />
      <template v-for="item in schemaItems" :key="item.id">
        <FormField :id="item.id" :label="item.name" :description="item.description">
          <component :is="getFieldComponent(item)" v-bind="item" />
        </FormField>
      </template>
    </template>

    <DDivider vertical />

    <FieldSchedule />

    <DFlex class="gap-4">
      <DButton type="submit" primary wide>{{ (applet.isInstalled) ? $t('generic.save') : $t('generic.install') }}</DButton>
      <DButton type="button" outline dash error v-if="applet.installationDetails?.uuid">{{ $t('generic.remove') }}</DButton>
    </DFlex>
  </form>
</div>
</template>
