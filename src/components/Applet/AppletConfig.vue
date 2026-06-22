<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import FormField from '../Form/FormField.vue';
import FieldSchedule from '../Form/AppletFields/FieldSchedule.vue';
import FeatureToggle from '../FeatureToggle.vue';

import { appletFieldComponents } from '../Form/AppletFields/index.ts';
import {
  appletConfigContextKey,
  type AppletConfigurationValue as ContextValue
} from '@/utils/applet-config-context.ts';

import { useClientApi } from '@/ws/index.ts';
import { useNotifications } from '@/composables/useNotifications.ts';

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
  Fieldset as DFieldset,
  Flex as DFlex,
  Label as DLabel,
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';
import DToggle from '(vendor)/daisy-ui-kit/components/Toggle.vue';
import { t } from 'i18next';

export interface Props {
  applet: IFullApplet;
}

const { applet }: Props = defineProps<Props>();

const { isConnected, applets, settings } = useClientApi();
const notifications = useNotifications();
const router = useRouter();

type AppletSchemaValue = IAppletSchemaObject['default'];
type AppletConfigurationValue = NonNullable<IAppletConfigurations['config'][string]>;
type RawAppletSchemaItem = Omit<IAppletSchemaObject, 'desc'> & {
  desc?: string;
  description?: string;
};
type AppletSchemaField = IAppletSchemaObject & {
  description: string;
};
type ParsedAppletSchema = Omit<IAppletSchema, 'schema'> & {
  schema: AppletSchemaField[];
};

const fieldComponents = appletFieldComponents;

const appletSchema = ref<ParsedAppletSchema | null>(null);
const schemaError = ref<string | null>(null);
const isSchemaLoading = ref(false);
const isSubmitting = ref(false);
const isRemoving = ref(false);
const isUpdatingHidden = ref(false);
const isUpdatingPinned = ref(false);
const formRef = ref<HTMLFormElement | null>(null);
const configurationValues = ref<Record<string, AppletConfigurationValue>>({});
const controllerLocation = ref<AppletConfigurationValue | null>(null);
const isHidden = ref(Boolean(applet.installationDetails?.isHidden));
const isPinned = ref(Boolean(applet.installationDetails?.isPinned));

const schemaItems = computed(() => appletSchema.value?.schema ?? []);
const hasSchemaItems = computed(() => schemaItems.value.length > 0);
const installedUuid = computed(() => applet.installationDetails?.uuid as UUID | undefined);
const isEditMode = computed(() => applet.isInstalled && Boolean(installedUuid.value));
const isBusy = computed(
  () =>
    isSchemaLoading.value ||
    isSubmitting.value ||
    isRemoving.value ||
    isUpdatingHidden.value ||
    isUpdatingPinned.value
);

const isAppletSchemaItem = (item: unknown): item is RawAppletSchemaItem => {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Partial<RawAppletSchemaItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    candidate.type in fieldComponents
  );
};

const getAppliedConfigurationValue = (
  item: Pick<IAppletSchemaObject, 'id'>
): AppletSchemaValue | undefined => {
  const appliedConfigurations = applet.installationDetails?.appliedConfigurations;

  if (!applet.isInstalled || !appliedConfigurations) {
    return undefined;
  }

  const config =
    appliedConfigurations.config ??
    (appliedConfigurations as unknown as Record<string, AppletSchemaValue>);

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

const normalizeSchemaItem = (item: RawAppletSchemaItem): AppletSchemaField => ({
  ...item,
  palette: item.type === 'color' ? (item.palette ?? ['#000000']) : item.palette,
  name: item.name ?? item.id,
  icon: item.icon ?? '',
  desc: item.desc ?? item.description ?? '',
  description: item.desc ?? item.description ?? '',
  default: normalizeDefaultValue(
    item,
    getAppliedConfigurationValue(item) ??
      (item.type === 'location' ? controllerLocation.value : undefined) ??
      item.default
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

const parseSchemaResponse = (schemaResponse: unknown): ParsedAppletSchema | null => {
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

  const candidate = schemaResponse as {
    version?: unknown;
    notifications?: unknown;
    schema?: unknown;
  };

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
    schemaError.value = t('applet.config.error.schemaUnavailable');
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
          ? t('applet.config.error.saveFailed')
          : t('applet.notification.playlist.install.error')
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
      message: t('applet.notification.playlist.remove.success'),
      hasCloseButton: true
    });
    await redirectToApplets();
  } catch (error) {
    notify({
      type: 'error',
      message: getErrorMessage(error, t('applet.notification.playlist.remove.error')),
      hasCloseButton: true
    });
  } finally {
    isRemoving.value = false;
  }
};

const updateHiddenState = async (nextValue: boolean) => {
  if (!applets || !installedUuid.value || isUpdatingHidden.value) return;

  const previousValue = isHidden.value;
  const previousPinned = isPinned.value;
  isHidden.value = nextValue;
  if (nextValue) isPinned.value = false;
  isUpdatingHidden.value = true;

  try {
    const updatedApplet = await applets.updateHidden(installedUuid.value, nextValue);
    isHidden.value = Boolean(updatedApplet?.installationDetails?.isHidden ?? nextValue);
    notify({
      type: 'success',
      message: t('applet.notification.playlist.hidden.success'),
      hasCloseButton: true
    });
  } catch (error) {
    isHidden.value = previousValue;
    isPinned.value = previousPinned;
    notify({
      type: 'error',
      message: getErrorMessage(error, t('applet.notification.playlist.hidden.error')),
      hasCloseButton: true
    });
  } finally {
    isUpdatingHidden.value = false;
  }
};

const updatePinnedState = async (nextValue: boolean) => {
  if (!applets || !installedUuid.value || isUpdatingPinned.value) return;

  const previousValue = isPinned.value;
  isPinned.value = nextValue;
  isUpdatingPinned.value = true;

  try {
    const updatedApplet = await applets.updatePinned(installedUuid.value, nextValue);
    isPinned.value = Boolean(updatedApplet?.installationDetails?.isPinned ?? nextValue);
    notify({
      type: 'success',
      message: t('applet.notification.playlist.pin.success'),
      hasCloseButton: true
    });
  } catch (error) {
    isPinned.value = previousValue;
    notify({
      type: 'error',
      message: getErrorMessage(error, t('applet.notification.playlist.pin.error')),
      hasCloseButton: true
    });
  } finally {
    isUpdatingPinned.value = false;
  }
};

// Expose the live config dict + setters to nested field components so
// generated sub-fields can read the source value and write their own.
provide(appletConfigContextKey, {
  packageName: applet.packageName,
  values: configurationValues,
  setValue: (id: string, value: ContextValue) => setConfigurationValue(id, value),
  ensureDefault: (id: string, value: ContextValue | undefined) => {
    if (value !== undefined && configurationValues.value[id] === undefined) {
      setConfigurationValue(id, value);
    }
  }
});

watch(
  () => [isConnected.value, applet.packageName],
  () => {
    void loadAppletSchema();
  },
  { immediate: true }
);

watch(
  () => applet.installationDetails?.isHidden,
  (nextValue) => {
    isHidden.value = Boolean(nextValue);
    isPinned.value = false;
  }
);

watch(
  () => applet.installationDetails?.isPinned,
  (nextValue) => {
    isPinned.value = Boolean(nextValue);
  }
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

      <DFieldset
        v-if="installedUuid"
        :legend="$t('detailPage.appletConfig.appletPlaylist.legend')"
        class="w-80 my-4 gap-4"
      >
        <DLabel label>
          <DToggle
            :model-value="isHidden"
            :disabled="!isConnected || isBusy"
            data-testid="applet-hidden-toggle"
            :aria-label="$t('detailPage.appletConfig.appletPlaylist.hiddenToggle.ariaLabel')"
            @update:model-value="(value) => updateHiddenState(Boolean(value))"
          />
          <DText>{{ $t('detailPage.appletConfig.appletPlaylist.hiddenToggle.label') }}</DText>
        </DLabel>

        <DLabel label>
          <DToggle
            :model-value="isPinned"
            :disabled="!isConnected || isHidden || isBusy"
            data-testid="applet-pin-toggle"
            :title="
              isHidden ? $t('detailPage.appletConfig.appletPlaylist.pinToggle.hiddenWarning') : ''
            "
            :aria-label="$t('detailPage.appletConfig.appletPlaylist.hiddenToggle.ariaLabel')"
            @update:model-value="(value) => updatePinnedState(Boolean(value))"
          />
          <DText>{{ $t('detailPage.appletConfig.appletPlaylist.pinToggle.label') }}</DText>
        </DLabel>
      </DFieldset>

      <DFlex class="gap-4">
        <DButton
          type="submit"
          primary
          wide
          data-testid="applet-config-submit"
          :disabled="!isConnected || isBusy"
        >
          {{
            isSubmitting
              ? $t('generic.loading')
              : isEditMode
                ? $t('generic.save')
                : $t('generic.install')
          }}
        </DButton>
        <DButton
          type="button"
          outline
          dash
          error
          v-if="installedUuid"
          data-testid="applet-remove"
          :disabled="!isConnected || isBusy"
          @click="handleRemove"
        >
          {{ isRemoving ? $t('generic.loading') : $t('generic.remove') }}
        </DButton>
      </DFlex>
    </form>
  </div>
</template>
