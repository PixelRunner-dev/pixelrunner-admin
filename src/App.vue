<script setup lang="ts">
import { ref, inject, onMounted } from 'vue';

import SiteHeader from '@/components/SiteHeader.vue';
import IconSprite from '@/components/Icon/IconSprite.vue';
import AccessWarning from '@/components/AccessWarning.vue';

import type { AccessMode } from '@/utils/access-detector.ts';

const accessMode = inject<AccessMode>('accessMode', 'unknown');
const showAccessWarning = ref(true);

onMounted(() => {
  // Show warning if accessed directly (not via proxy)
  if (accessMode === 'local') {
    showAccessWarning.value = false;
  }
});
</script>

<template>
  <template v-if="!showAccessWarning">
    <header class="px-4 py-2 mb-8 rounded-box sticky top-3 z-500 shadow-md bg-base-200">
      <div class="site-wrapper">
        <SiteHeader />
      </div>
    </header>

    <router-view v-slot="{ Component }">
      <keep-alive>
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </keep-alive>
    </router-view>
  </template>

  <template v-else>
    <router-view>
      <AccessWarning />
    </router-view>
  </template>

  <icon-sprite />
</template>

<style>
@import "tailwindcss";

@plugin "daisyui" {
  themes: all;
}

@plugin "daisyui/theme" {
  name: "pixelrunner";
  default: true;
  prefersdark: false;
  color-scheme: "light";
  --color-base-100: oklch(97% 0.001 106.424);
  --color-base-200: #F7DBBF;
  --color-base-300: oklch(70% 0.213 47.604);
  --color-base-content: #4f2a07;
  --color-primary: #4f2a07;
  --color-primary-content: oklch(98% 0.018 155.826);
  --color-secondary: oklch(50% 0.213 27.518);
  --color-secondary-content: oklch(98% 0.016 73.684);
  --color-accent: oklch(66% 0.179 58.318);
  --color-accent-content: oklch(98% 0.014 180.72);
  --color-neutral: oklch(92% 0.003 48.717);
  --color-neutral-content: #4f2a07;
  --color-info: oklch(78% 0.154 211.53);
  --color-info-content: oklch(30% 0.056 229.695);
  --color-success: oklch(77% 0.152 181.912);
  --color-success-content: oklch(27% 0.046 192.524);
  --color-warning: oklch(85% 0.199 91.936);
  --color-warning-content: oklch(28% 0.066 53.813);
  --color-error: oklch(63% 0.237 25.331);
  --color-error-content: oklch(28% 0.109 3.907);
  --radius-selector: 0.25rem;
  --radius-field: 0.625rem;
  --radius-box: 0.625rem;
  --size-selector: 0.28125rem;
  --size-field: 0.3125rem;
  --border: 1px;
  --depth: 1;
  --noise: 1;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s;
}
.page-enter,
.page-leave-to {
  opacity: 0;
}
</style>
