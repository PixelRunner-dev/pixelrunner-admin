<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

import type { IAppletImage } from 'pixelrunner-shared';

interface Props extends IAppletImage {
  showFrame?: boolean;
}

const TIMESTAMP_DEVIATION = 100_000;
const props = withDefaults(defineProps<Props>(), {
  showFrame: false
});

const isBase64 = computed(() => props.src.startsWith('data:image/'));

const timestamp = ref(
  props.dateModified
    ? Math.floor(new Date(props.dateModified).getTime() / TIMESTAMP_DEVIATION)
    : Math.floor(Date.now() / TIMESTAMP_DEVIATION)
);

const imgSrc = computed(() => {
  return isBase64.value ? props.src : `${props.src}?v=${timestamp.value}`;
});

onMounted(() => {
  setInterval(() => {
    if (!props.dateModified) timestamp.value = Math.floor(Date.now() / TIMESTAMP_DEVIATION);
  }, 1000);
});

watch(
  () => props.dateModified,
  (newDateModified) => {
    timestamp.value = newDateModified
      ? Math.floor(newDateModified.getTime() / TIMESTAMP_DEVIATION)
      : Math.floor(Date.now() / TIMESTAMP_DEVIATION);
  }
);
</script>

<template>
  <div class="component--applet-image" :class="{ 'is-showing-frame': props.showFrame }">
    <div v-if="props.showFrame" class="image-frame frame__outer-bevel">
      <div class="frame__flat-surface">
        <div class="frame__inner-bevel">
          <img
            :key="imgSrc"
            :src="imgSrc"
            :alt="props.alt"
            class="applet-image"
            loading="lazy"
            :data-created="props.dateCreated"
            :data-modified="props.dateModified"
          />
        </div>
      </div>
    </div>

    <img
      v-else
      :key="imgSrc"
      :src="imgSrc"
      :alt="props.alt"
      class="applet-image"
      loading="lazy"
      :data-created="props.dateCreated"
      :data-modified="props.dateModified"
    />
  </div>
</template>

<style scoped>
.component--applet-image {
  background-color: black;
}

.component--applet-image:not(.is-showing-frame) {
  overflow: hidden;
}

.is-showing-frame {
  --s: 150px; /* adjust this to control the size */
  --_d: calc(0.21 * var(--s));

  aspect-ratio: 2 / 1;
  margin-top: 4rem;
  position: relative;
}

.is-showing-frame::before {
  content: '';
  clip-path: polygon(
    var(--_d) 0,
    100% 0,
    100% calc(100% - var(--_d)),
    calc(100% - var(--_d)) 100%,
    0 100%,
    0 var(--_d)
  );
  background: conic-gradient(
    from -90deg at calc(100% - var(--_d)) var(--_d),
    #703d15 135deg,
    #3b2805 0 270deg,
    transparent 0
  );
  width: calc(100% + var(--_d));
  height: calc(100% + var(--_d));
  display: block;
  position: absolute;
  top: calc(var(--_d) * -1);
  right: calc(var(--_d) * -1);
  z-index: -1;
}

.image-frame {
  border-color: rgb(109, 84, 58) rgb(24, 19, 13) rgb(24, 19, 13) rgb(109, 84, 58);
  border-style: solid;
  border-width: 5px;
}

.image-frame > div {
  border: 12px solid rgb(65, 40, 16);
}

.image-frame > div > div {
  border-color: rgb(24, 19, 13) rgb(109, 84, 58) rgb(109, 84, 58) rgb(24, 19, 13);
  border-style: solid;
  border-width: 5px;
}

.applet-image {
  aspect-ratio: 2 / 1;
  background-image: url(/broken-image.webp);
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 50%;
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
