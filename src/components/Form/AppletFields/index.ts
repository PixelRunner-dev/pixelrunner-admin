/**
 * Shared map of Tidbyt schema field types → Vue components.
 * Re-used by AppletConfig (top-level form) and FieldGenerated
 * (renders dynamic sub-fields returned from a handler).
 */

import { defineAsyncComponent, type Component } from 'vue';

import type { AppletSchemaTypes } from 'pixelrunner-shared';

export const appletFieldComponents: Partial<Record<AppletSchemaTypes, Component>> = {
  color: defineAsyncComponent(() => import('./FieldColor.vue')),
  datetime: defineAsyncComponent(() => import('./FieldDatetime.vue')),
  dropdown: defineAsyncComponent(() => import('./FieldDropdown.vue')),
  generated: defineAsyncComponent(() => import('./FieldGenerated.vue')),
  location: defineAsyncComponent(() => import('./FieldLocation.vue')),
  locationbased: defineAsyncComponent(() => import('./FieldLocationbased.vue')),
  oauth2: defineAsyncComponent(() => import('./FieldOauth2.vue')),
  photoselect: defineAsyncComponent(() => import('./FieldPhotoselect.vue')),
  text: defineAsyncComponent(() => import('./FieldText.vue')),
  onoff: defineAsyncComponent(() => import('./FieldOnoff.vue')),
  typeahead: defineAsyncComponent(() => import('./FieldTypeahead.vue'))
};
