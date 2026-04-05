<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useWebSocket } from '@/ws';

import AppletItem from '@/components/Applet/AppletItem.vue';
import AppletConfig from '@/components/Applet/AppletConfig.vue';
import AppletDetails from '@/components/Applet/AppletDetails.vue';
import AppletImage from '@/components/Applet/AppletImage.vue';
import CategoryList from '@/components/CategoryList.vue';

import playlistMock from '@/../test/mocks/playlists.json';

const route = useRoute();
const { packageName, uuid } = route.params;
const { isConnected, applets } = useWebSocket();

const applet = ref();

onMounted(async () => {
  if (isConnected.value) {
    applet.value = await applets.get(packageName, uuid);
  }

  applet.value = playlistMock[0]?.applets[0];
});
</script>

<template>
  <main class="site-wrapper">

    <!-- <pre>[applet: {{ applet }}]</pre> -->

    <template v-if="!applet">
      <h1>Applet not found</h1>
    </template>

    <AppletItem v-else :applet>
      <template #item="applet">
        <AppletImage v-bind="(applet.installedApplet && 'uuid' in applet.installedApplet) ? applet.installedApplet?.image : applet.defaultImage" />
        <AppletDetails v-bind="applet.details" view="full-detail" />
        <CategoryList v-if="applet.categories" :categories="applet.categories" hasItemsInline />
        <AppletConfig :applet />
      </template>
    </AppletItem>
  </main>
</template>
