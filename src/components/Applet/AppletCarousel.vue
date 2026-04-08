<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

import { Carousel } from '@/adapters/CarouselAdapter.ts';
import AppletList from './AppletList.vue';

import type { IFullApplet } from 'pixelrunner-shared/lib/interfaces';

interface Props {
  applets: IFullApplet[];
}

const { applets }: Props = defineProps<Props>();

const carousel = ref();
let carouselInstance: Carousel | null = null;
onMounted(() => {
  carouselInstance = new Carousel({ container: carousel.value });
});

onBeforeUnmount(() => {
  carouselInstance?.destroy();
});
</script>

<template>
  <div class="component--carousel" ref="carousel">
    <AppletList :applets :classes="{ list: 'carousel__track', item: 'carousel__track__item' }">
      <template #item="applet">
        <slot name="item" v-bind="applet" />
      </template>
    </AppletList>

    <button class="btn btn-xs _prev" data-action="prev">
      {{ $t('generic.prev') }}
    </button>
    <button class="btn btn-xs next" data-action="next">
      {{ $t('generic.next') }}
    </button>
  </div>
</template>

<style>
.component--carousel {
  position: relative;
}

.component--carousel .carousel__track {
  display: flex;
  gap: 1rem;
  overflow: hidden;
  overflow-x: auto;
  overscroll-behavior-y: auto;
  overscroll-behavior-x: none;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.component--carousel .carousel__track::-webkit-scrollbar {
  display: none;
}

/* .component--carousel .scroll__track._grabbing,
.component--carousel .carousel__track._grabbing {
  cursor: grab;
  user-select: none;
}

.component--carousel .scroll__track._grabbing::before,
.component--carousel .carousel__track._grabbing::before {
  bottom: 0;
  content: '';
  display: block;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 999;
} */

/* .component--carousel.has-proximity-snap .carousel__track {
  scroll-snap-type: x proximity;
} */

/* @media (--mobile) {
  .component--carousel .carousel__ctrl {
    display: none;
  }
} */

.component--carousel .carousel__ctrl._prev svg {
  transform: rotate(180deg);
  transform-origin: center;
}

.component--carousel .component--carousel.is-initialized.is-next-button-visible::after,
.component--carousel .component--carousel.is-initialized.is-prev-button-visible::before {
  opacity: 1;
  visibility: visible;
}

/* pagination */

.component--carousel .pagination {
  justify-content: center;
  margin: 5px;
  text-align: center;
}

.component--carousel .page {
  background-color: var(--page-indicator--background-color, grey);
  border: none;
  border-radius: 10px;
  display: inline-block;
  height: 6px;
  margin: 3px;
  padding: 0;
  transition: background-color ease 0.4s;
  width: 6px;
}

.component--carousel .page.is-current-page {
  background-color: var(--page-indicator-current--background-color, brown);
}

/* content and variations */

.component--carousel .carousel__track__item {
  align-items: center;
  display: flex;
  justify-content: center;
  scroll-snap-align: start;
}

.component--carousel .carousel__track__item:focus {
  outline: 0;
}

@media (--tablet) {
  .component--carousel .carousel__track__item {
    scroll-snap-align: start;
  }
}

.component--carousel .carousel__track__item.--product-tile .fragment--tile {
  margin: var(--space--10, 10px) calc(var(--space--10, 10px) / 2);
  width: 100%;
}

@media (--mobile) {
  .component--carousel .carousel__track__item {
    max-width: calc(100% - 5rem);
    min-width: calc(100% - 5rem);
  }
}

@media (--tablet-only) {
  .component--carousel .carousel__track__item.--product-tile,
  .component--carousel .carousel__track__item.--top-task {
    max-width: calc(50% - 2.75rem);
    min-width: calc(50% - 2.75rem);
  }
}

@media (--desktop) {
  .component--carousel .carousel__track__item.--product-tile {
    max-width: calc(33.3334% - 1.5rem);
    min-width: calc(33.3334% - 1.5rem);
  }

  .component--carousel .carousel__track__item.--top-task {
    max-width: calc(33.3334% - 1.5rem);
    min-width: calc(33.3334% - 1.5rem);
  }
}

@media (--widescreen) {
  .component--carousel .carousel__track__item.--product-tile {
    max-width: calc(25% - 1.5rem);
    min-width: calc(25% - 1.5rem);
  }
}

.component--carousel .carousel__track__item.--product-image {
  max-width: 100%;
  min-width: 100%;
}

.component--carousel .carousel__track__item.--image-slider {
  max-width: 100%;
  min-width: 100%;
}

/* Vertical carousel */

.component--carousel .scroll {
  padding: 1px 10px;
  position: relative;
}

.component--carousel .scroll::before,
.component--carousel .scroll::after {
  background-color: transparent;
  content: '';
  height: 1px;
  left: 50%;
  opacity: 0;
  position: absolute;
  transition: ease 0.3s;
  transition-property: width, left, opacity;
  width: 0;
  z-index: 1;
}

/* This is the heart of the carousel */
.component--carousel .scroll__track {
  display: flex;
  flex-direction: column;
  height: 400px;
  overflow: hidden;
  overflow-y: auto;
  overscroll-behavior-x: contain;
  overscroll-behavior-y: none;
  scroll-behavior: smooth;
  scroll-snap-type: y proximity;
  scrollbar-width: none;
}

.component--carousel .scroll__track::-webkit-scrollbar {
  display: none;
}

.component--carousel .thumb {
  background: transparent;
  cursor: pointer;
  display: block;
  height: 40px;
  line-height: 40px;
  margin-bottom: 5px;
  position: relative;
  scroll-snap-align: center;
  text-align: center;
  width: 40px;
}

.component--carousel .thumb::after {
  bottom: 0;
  box-shadow: inset 0 0 0 0 transparent;
  content: '';
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: box-shadow ease 0.3s;
}

.component--carousel .thumb.is-current-page::after {
  box-shadow: inset 0 0 0 3px transparent;
}

/* Gallery */

.component--carousel .gallery {
  display: flex;
}

.component--carousel .gallery .scroll {
  flex-basis: 40px;
  margin-right: 20px;
}

.component--carousel .gallery .component--carousel {
  max-width: 400px;
  width: 100%;
}
</style>
