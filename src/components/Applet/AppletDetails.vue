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
  <DFlex col :class="['component--applet-details', 'gap-2', { 'my-4': view === 'full-detail' }]">
    <hgroup>
      <component :is="view === 'full-detail' ? 'h1' : 'h2'" :class="view === 'full-detail' ? 'text-5xl my-4' : 'text-lg'">
        {{ name }}
        <span
          v-if="isOfficialApplet"
          class="badge badge-primary badge-sm ml-2">
          {{ $t('generic.official') }}
        </span>
      </component>

      <template v-if="view === 'full-detail' || view === 'preview'">
        <p class="text-xs mt-2">[By]: {{ author }}</p>
      </template>
    </hgroup>

    <template v-if="view === 'full-detail'">
      <p class="text-xl">{{ summary }}</p>

      <p class="max-width-full-text">{{ desc }}</p>
    </template>
  </DFlex>
</template>
