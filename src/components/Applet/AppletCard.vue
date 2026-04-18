<script setup lang="ts">
import { computed } from 'vue';

import AppletDetails from './AppletDetails.vue';
import AppletImage from './AppletImage.vue';
import CategoryList from '@/components/CategoryList.vue';

import type { IAppletViews, IFullApplet } from 'pixelrunner-shared';

import {
  Flex as DFlex
} from '(vendor)/daisy-ui-kit/index.ts';

export interface Props {
  applet: IFullApplet;
  view?: IAppletViews;
  isDragable?: boolean;
  hasCallToAction?: boolean;
  hasCategories?: boolean;
}

const {
  applet,
  view = 'horizontal' as IAppletViews,
  hasCallToAction = false,
  hasCategories = false
}: Props = defineProps<Props>();
const { details, categories } = applet;

const appletImage = computed(() => {
  if (applet.isInstalled && applet.installationDetails?.image) {
    return applet.installationDetails.image;
  }
  return applet.defaultImage;
})
</script>

<template>
  <DFlex is="article" :class="['component--applet-card', `applet-card--${view}`]">
    <component
      :is="hasCallToAction ? 'div' : 'router-link'"
      :to="hasCallToAction ? undefined : `/store/applets/${applet.packageName}`">
      <figure class="w-full">
        <AppletImage v-bind="appletImage" />

        <figcaption>
          <AppletDetails v-bind="details" :view="view" />

          <!-- <CategoryList v-if="hasCategories" :categories hasItemsInline /> -->

          <router-link
            v-if="hasCallToAction && applet.isInstalled"
            :to="`/applets/${applet.installationDetails?.uuid}`"
            class="btn btn-secondary">
            <slot name="cta" />
          </router-link>
        </figcaption>
      </figure>
    </component>
  </DFlex>
</template>

<style scoped>
.applet-card--horizontal > div {
  width: 100%;
}

.applet-card--horizontal figure {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
}

.applet-card--vertical figure {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.applet-card--preview figure {
  width: 21rem;
}

.applet-card--preview figcaption {
  bottom: 0;
  left: 0;
  padding: 0.5rem 1rem;
  width: 100%;
}
</style>
