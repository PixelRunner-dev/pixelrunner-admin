<script setup lang="ts">
import type { IFullApplet } from 'pixelrunner-shared;

interface Props {
  applet: IFullApplet;
}

const { applet }: Props = defineProps<Props>();
</script>

<template>
  <slot name="item" v-bind="applet" />
</template>
