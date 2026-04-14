<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue';

import FormField from '../Form/FormField.vue';
import FieldSchedule from '../Form/AppletFields/FieldSchedule.vue';

import { useWebSocket } from '@/ws/index.ts';
import { toPascalCase } from '@/utils/generic.ts';

import type { IFullApplet, IAppletSchemaObject } from 'pixelrunner-shared';

import {
  Button as DButton,
  Divider as DDivider,
  Flex as DFlex
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  applet: IFullApplet;
}

const { applet }: Props = defineProps<Props>();

const { isConnected, applets } = useWebSocket();

const getFieldComponent = (item: { type: string }) => {
  return defineAsyncComponent(() => import(`../Form/AppletFields/Field${toPascalCase(item.type)}.vue`));
};

const appletSchema = ref<Record<string, unknown> | null>();

onMounted(async () => {
  if (isConnected && isConnected.value && applets) {
    appletSchema.value = await applets.getSchema(applet.packageName);
    console.log('applet appletSchema via ws', appletSchema.value);
  }

  console.log('onder connected');

  appletSchema.value = {
    version: '1',
    notifications: [],
    schema: [
      {
        "type": "color",
        "id": "myColorField",
        "name": "myColorFieldName",
        "desc": "myColorFieldDescription",
        "icon": "brush",
        "default": "#000000",
        "palette": ["#000000", "#777777", "#ffffff"]
      },
      {
        "type": "datetime",
        "id": "myDateTimeField",
        "name": "myDateTimeFieldName",
        "desc": "myDateTimeFieldDescription",
        "icon": "clock"
      },
      {
        "type": "dropdown",
        "id": "myDropdownField",
        "name": "myDropdownFieldName",
        "desc": "myDropdownFieldDescription",
        "icon": "arrowDown",
        "options": [
          {
            "display": "myDropdownOption1Display",
            "value": "myDropdownOption1Value"
          },
          {
            "display": "myDropdownOption2Display",
            "value": "myDropdownOption2Value"
          }
        ],
        "default": "myDropdownOption1Value"
      },
      {
        "type": "generated",
        "id": "myGeneratedField",
        "name": "myGeneratedFieldName",
        "desc": "myGeneratedFieldDescription",
        "icon": "gear",
        "source": "myColorField",
        "handler": "myGeneratedFieldHandler"
      },
      {
        "type": "location",
        "id": "myLocationField",
        "name": "myLocationFieldName",
        "desc": "myLocationFieldDescription",
        "icon": "locationPin"
      },
      {
        "type": "locationbased",
        "id": "myLocationBasedField",
        "name": "myLocationBasedFieldName",
        "desc": "myLocationBasedFieldDescription",
        "icon": "marker",
        "handler": "myLocationBasedFieldHandler"
      },
      {
        "type": "oauth2",
        "id": "myOAuth2Field",
        "name": "myOAuth2FieldName",
        "desc": "myOAuth2FieldDescription",
        "icon": "key",
        "handler": "myOAuth2FieldHandler",
        "client_id": "96065a61c9ce483fb76f122a150933b3",
        "authorization_endpoint": "https://accounts.spotify.com/oauth2/v2/auth",
        "scopes": ["user-read-currently-playing", "user-read-playback-state"]
      },
      {
        "type": "photoselect",
        "id": "myPhotoSelectField",
        "name": "myPhotoSelectFieldName",
        "desc": "myPhotoSelectFieldDescription",
        "icon": "image"
      },
      {
        "type": "text",
        "id": "myTextField",
        "name": "myTextFieldName",
        "desc": "myTextFieldDescription",
        "icon": "pen",
        "default": "myTextFieldDefault",
        "secret": false
      },
      {
        "type": "onoff",
        "id": "myToggleField",
        "name": "myToggleFieldName",
        "desc": "myToggleFieldDescription",
        "icon": "sliders",
        "default": false
      },
      {
        "type": "typeahead",
        "id": "myTypeaheadField",
        "name": "myTypeaheadFieldName",
        "desc": "myTypeaheadFieldDescription",
        "icon": "text-width",
        "handler": "myTypeaheadFieldHandler"
      }
    ]
  }
});

function fieldValue(item: IAppletSchemaObject) {
  const itemWithAppliedConfigurations = { ...item };
  if (applet.isInstalled && applet.installationDetails && applet.installationDetails.appliedConfigurations) {
    itemWithAppliedConfigurations.default = applet.installationDetails.appliedConfigurations[item.id];
  }
  return itemWithAppliedConfigurations;
}
</script>

<template>
<div class="component--applet-config">
  <form>
    <template v-if="appletSchema">
      <DDivider vertical />
      <!-- <pre>[{{ appletSchema }}]</pre> -->
      <!-- <pre>[{{ applet.installationDetails?.appliedConfigurations }}]</pre> -->
      <template v-for="item in appletSchema.schema" :key="item.id">
        <FormField :id="item.id" :label="item.name" :description="item.desc">
          <component :is="getFieldComponent(item)" v-bind="fieldValue(item)" />
        </FormField>
      </template>
    </template>
    <template v-else>...</template>

    <DDivider vertical />

    <FieldSchedule />

    <DFlex class="gap-4">
      <DButton type="submit" primary wide>{{ (applet.isInstalled) ? $t('generic.save') : $t('generic.install') }}</DButton>
      <DButton type="button" outline dash error v-if="applet.installationDetails?.uuid">{{ $t('generic.remove') }}</DButton>
    </DFlex>
  </form>
</div>
</template>
