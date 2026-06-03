<script setup lang="ts">
import type { IAppletDetails, IAppletViews } from 'pixelrunner-shared';

import { Flex as DFlex } from '(vendor)/daisy-ui-kit/index.ts';

interface IAppletDetailsWithView extends IAppletDetails {
  view: IAppletViews;
}

const {
  name,
  summary,
  desc,
  author,
  isOfficialApplet = false,
  view = 'horizontal' as IAppletViews
}: IAppletDetailsWithView = defineProps<IAppletDetailsWithView>();
</script>

<template>
  <DFlex
    col
    data-testid="applet-details"
    :data-view="view"
    :class="['component--applet-details', 'gap-2', { 'my-4': view === 'full-detail' }]"
  >
    <hgroup>
      <component
        :is="view === 'full-detail' ? 'h1' : 'h2'"
        data-testid="applet-details-title"
        :class="view === 'full-detail' ? 'text-5xl my-4' : 'text-lg'"
      >
        {{ name }}
        <span
          v-if="isOfficialApplet"
          class="badge badge-primary badge-sm ml-2"
          data-testid="applet-official-badge"
        >
          {{ $t('generic.official') }}
        </span>
      </component>

      <template v-if="view === 'full-detail' || view === 'preview'">
        <p class="text-xs mt-2" data-testid="applet-details-author">
          {{ $t('applet.details.createdBy', { author }) }}
        </p>
      </template>
    </hgroup>

    <template v-if="view === 'full-detail'">
      <p class="text-xl" data-testid="applet-details-summary">{{ summary }}</p>

      <p class="max-width-full-text" data-testid="applet-details-description">{{ desc }}</p>
    </template>
  </DFlex>
</template>
