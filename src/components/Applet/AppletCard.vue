<script setup lang="ts">
import { computed } from 'vue';

import AppletDetails from './AppletDetails.vue';
import AppletImage from './AppletImage.vue';

import type { IAppletViews, IFullApplet } from 'pixelrunner-shared';

import { Flex as DFlex } from '(vendor)/daisy-ui-kit/index.ts';

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
  hasCallToAction = false
}: Props = defineProps<Props>();
const { details } = applet;

const appletImage = computed(() => {
  if (applet.isInstalled && applet.installationDetails?.image) {
    return applet.installationDetails.image;
  }
  return applet.defaultImage;
});
</script>

<template>
  <DFlex
    is="article"
    data-testid="applet-card"
    :data-applet-package-name="applet.packageName"
    :data-applet-uuid="applet.installationDetails?.uuid"
    :class="[
      'component--applet-card',
      `applet-card--${view}`,
      {
        'applet-card--is-hidden': applet.installationDetails?.isHidden,
        'applet-card--is-pinned': applet.installationDetails?.isPinned
      }
    ]"
  >
    <component
      :is="hasCallToAction ? 'div' : 'router-link'"
      :to="hasCallToAction ? undefined : `/library/applets/${applet.packageName}`"
    >
      <figure class="w-full">
        <AppletImage v-bind="appletImage" />

        <figcaption>
          <AppletDetails v-bind="details" :view="view" />

          <router-link
            v-if="hasCallToAction && applet.isInstalled"
            :to="`/applets/${applet.installationDetails?.uuid}`"
            class="btn btn-secondary btn-sm"
            data-testid="applet-configure-link"
          >
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

.applet-card--is-hidden::after,
.applet-card--is-pinned::after {
  content: '';
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}

[data-theme-mode='dark'] .applet-card--is-hidden::after {
  background-color: rgba(0, 0, 0, 0.33);
}

[data-theme-mode='light'] .applet-card--is-hidden::after {
  background-color: rgba(255, 255, 255, 0.33);
}

.applet-card--is-hidden::after {
  backdrop-filter: grayscale(1);
}

.applet-card--is-pinned::after {
  border: calc(var(--border) * 4) solid transparent;
  border-radius: calc(var(--radius-box) * 1.2);
  box-shadow: inset 0 0 0 3px var(--color-accent);
}
</style>
