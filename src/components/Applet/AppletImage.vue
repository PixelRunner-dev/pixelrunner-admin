<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

import type { IAppletImage } from 'pixelrunner-shared/lib/interfaces';

const TIMESTAMP_DEVIATION = 100000;
const { src, alt, dateCreated, dateModified }: IAppletImage = defineProps<IAppletImage>();

const isBase64 = computed(() => src.startsWith('data:image/'));

const timestamp = ref(
  dateModified
    ? Math.floor(new Date(dateModified).getTime() / TIMESTAMP_DEVIATION)
    : Math.floor(Date.now() / TIMESTAMP_DEVIATION)
);

const imgSrc = computed(() => isBase64.value ? src : `${src}?v=${timestamp.value}`);

onMounted(() => {
  setInterval(() => {
    if (!dateModified) timestamp.value = Math.floor(Date.now() / TIMESTAMP_DEVIATION);
  }, 1000);
});

watch(
  () => dateModified,
  (newDateModified) => {
    timestamp.value = newDateModified
      ? Math.floor(newDateModified.getTime() / TIMESTAMP_DEVIATION)
      : Math.floor(Date.now() / TIMESTAMP_DEVIATION);
  }
);
</script>

<template>
  <div class="component--applet-image">
    <img
      :key="imgSrc"
      :src="imgSrc"
      :alt
      class="applet-image"
      loading="lazy"
      :data-created="dateCreated"
      :data-modified="dateModified"
    />
  </div>
</template>

<style scoped>
.component--applet-image {
  background-color: black;
  overflow: hidden;
}

.applet-image {
  aspect-ratio: 2 / 1;
  display: flex;
  image-rendering: pixelated;
  mask-image: url('/mask.png');
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  min-width: 192px;
  width: 100%;
}
</style>
