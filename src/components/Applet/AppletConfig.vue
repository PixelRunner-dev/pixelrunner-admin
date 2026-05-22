<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import FormField from '../Form/FormField.vue';
import FieldSchedule from '../Form/AppletFields/FieldSchedule.vue';
import FeatureToggle from '../FeatureToggle.vue';

import { useClientApi } from '@/ws/index.ts';
import { useNotifications } from '@/composables/useNotifications.ts';

import type { Component } from 'vue';
import type {
  IAppletConfigurations,
  IAppletSchema,
  IAppletSchemaObject,
  IFullApplet,
  UUID
} from 'pixelrunner-shared';
import type { Notification } from '@/utils/notifications.ts';

import {
  Button as DButton,
  Divider as DDivider,
  Flex as DFlex
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  applet: IFullApplet;
}

const { applet }: Props = defineProps<Props>();

const { isConnected, applets, settings } = useClientApi();
const notifications = useNotifications();
const router = useRouter();

type AppletSchemaValue = IAppletSchemaObject['default'];
type AppletConfigurationValue = NonNullable<IAppletConfigurations['config'][string]>;
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
const isSubmitting = ref(false);
const isRemoving = ref(false);
const formRef = ref<HTMLFormElement | null>(null);
const configurationValues = ref<Record<string, AppletConfigurationValue>>({});
const controllerLocation = ref<AppletConfigurationValue | null>(null);

const schemaItems = computed(() => appletSchema.value?.schema ?? []);
const hasSchemaItems = computed(() => schemaItems.value.length > 0);
const installedUuid = computed(() => applet.installationDetails?.uuid as UUID | undefined);
const isEditMode = computed(() => applet.isInstalled && Boolean(installedUuid.value));
const isBusy = computed(() => isSchemaLoading.value || isSubmitting.value || isRemoving.value);

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
  default: normalizeDefaultValue(
    item,
    getAppliedConfigurationValue(item)
      ?? (item.type === 'location' ? controllerLocation.value : undefined)
      ?? item.default
  )
});

const parseSettingValue = (value: unknown): AppletConfigurationValue | null => {
  if (typeof value === 'string') {
    if (!value) return null;

    try {
      return JSON.parse(value) as AppletConfigurationValue;
    } catch {
      return value;
    }
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (value !== null && typeof value === 'object')
  ) {
    return value;
  }

  return null;
};

const getSchemaItemInitialValue = (item: IAppletSchemaObject): AppletConfigurationValue => {
  if (item.default !== undefined) {
    return item.default;
  }

  switch (item.type) {
    case 'onoff':
      return false;
    case 'color':
      return item.palette?.[0] ?? '#000000';
    case 'dropdown':
      return item.options?.[0]?.value ?? '';
    case 'location':
      return {};
    default:
      return '';
  }
};

const createInitialConfigurationValues = (
  items: IAppletSchemaObject[]
): Record<string, AppletConfigurationValue> => {
  return items.reduce<Record<string, AppletConfigurationValue>>((values, item) => {
    values[item.id] = getSchemaItemInitialValue(item);

    return values;
  }, {});
};

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

const setConfigurationValue = (id: string, value: AppletConfigurationValue) => {
  configurationValues.value = {
    ...configurationValues.value,
    [id]: value
  };
};

const createAppliedConfigurations = (): IAppletConfigurations => ({
  appId: applet.packageName,
  config: { ...configurationValues.value }
});

const notify = (notification: Notification) => {
  notifications?.addNotification(notification);
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const loadAppletSchema = async () => {
  if (!isConnected.value || !applets) return;

  isSchemaLoading.value = true;
  schemaError.value = null;

  try {
    controllerLocation.value = settings
      ? parseSettingValue(await settings.get<string | undefined>('location'))
      : null;

    const schema = parseSchemaResponse(await applets.getSchema(applet.packageName));
    appletSchema.value = schema;
    configurationValues.value = createInitialConfigurationValues(schema?.schema ?? []);
  } catch (error) {
    appletSchema.value = null;
    configurationValues.value = {};
    console.error('Failed to load applet schema', error);
    schemaError.value = 'Configuration schema unavailable.';
    notify({
      type: 'error',
      message: getErrorMessage(error, schemaError.value),
      hasCloseButton: true
    });
  } finally {
    isSchemaLoading.value = false;
  }
};

const redirectToApplets = async () => {
  await router.replace('/applets');
};

const handleSubmit = async () => {
  if (!applets || isBusy.value || !formRef.value?.reportValidity()) return;

  isSubmitting.value = true;

  try {
    const appliedConfigurations = createAppliedConfigurations();

    if (isEditMode.value) {
      await applets.saveConfig(installedUuid.value as UUID, appliedConfigurations);
    } else {
      await applets.install(applet.packageName, appliedConfigurations);
    }

    await redirectToApplets();
  } catch (error) {
    notify({
      type: 'error',
      message: getErrorMessage(
        error,
        isEditMode.value
          ? 'Failed to save applet configuration.'
          : 'Failed to install applet.'
      ),
      hasCloseButton: true
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleRemove = async () => {
  if (!applets || !installedUuid.value || isBusy.value) return;

  isRemoving.value = true;

  try {
    await applets.remove(installedUuid.value);
    notify({
      type: 'success',
      message: 'Applet removed from playlist.',
      hasCloseButton: true
    });
    await redirectToApplets();
  } catch (error) {
    notify({
      type: 'error',
      message: getErrorMessage(error, 'Failed to remove applet from playlist.'),
      hasCloseButton: true
    });
  } finally {
    isRemoving.value = false;
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
  <form ref="formRef" @submit.prevent="handleSubmit">
    <template v-if="isSchemaLoading">...</template>
    <template v-else-if="schemaError">
      {{ schemaError }}
    </template>
    <template v-else-if="hasSchemaItems">
      <DDivider vertical />
      <template v-for="item in schemaItems" :key="item.id">
        <FormField :id="item.id" :label="item.name" :description="item.description">
          <component
            :is="getFieldComponent(item)"
            v-bind="item"
            :model-value="configurationValues[item.id]"
            @update:model-value="setConfigurationValue(item.id, $event)"
          />
        </FormField>
      </template>
    </template>

    <DDivider vertical />

    <FeatureToggle features="appletScheduler">
      <FieldSchedule />
    </FeatureToggle>

    <DFlex class="gap-4">
      <DButton type="submit" primary wide :disabled="!isConnected || isBusy">
        {{ isSubmitting ? $t('generic.loading') : (isEditMode ? $t('generic.save') : $t('generic.install')) }}
      </DButton>
      <DButton
        type="button"
        outline
        dash
        error
        v-if="installedUuid"
        :disabled="!isConnected || isBusy"
        @click="handleRemove"
      >
        {{ isRemoving ? $t('generic.loading') : $t('generic.remove') }}
      </DButton>
    </DFlex>
  </form>
</div>
</template>
