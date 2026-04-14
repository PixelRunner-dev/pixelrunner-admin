<script setup lang="ts">
import type { IAppletDetails, IAppletViews } from 'pixelrunner-shared;

import { Flex as DFlex } from '(vendor)/daisy-ui-kit/index.ts';

interface IAppletDetailsWithView extends IAppletDetails {
  view: IAppletViews;
}

const {
  name,
  summary,
  desc,
  author,
  tags = [],
  isOfficialApplet = false,
  view = 'horizontal' as IAppletViews
}: IAppletDetailsWithView = defineProps<IAppletDetailsWithView>();
</script>

<template>
  <DFlex col :class="['component--applet-details', 'gap-2', { 'my-4': view === 'full-detail' }]">
    <hgroup>
      <component :is="view === 'full-detail' ? 'h1' : 'h2'" :class="view === 'full-detail' ? 'text-5xl' : 'text-2xl'">
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

      <p>{{ desc }}</p>

      <ul class="flex flex-wrap gap-2">
        <li v-for="tag in tags" :key="tag" class="badge badge-neutral badge-sm">{{ tag }}</li>
      </ul>
    </template>
  </DFlex>
</template>
