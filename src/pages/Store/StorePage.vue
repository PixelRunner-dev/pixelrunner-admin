<script setup lang="ts">
import { computed } from 'vue';

import type { IFullApplet } from 'pixelrunner-shared';

import { useClientApi } from '@/ws/index.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { toCapitalizeWords } from '@/utils/generic.ts';

import StoreSearch from '@/components/Store/StoreSearch.vue';
import StoreSection from '@/components/Store/StoreSection.vue';
import AppletCarousel from '@/components/Applet/AppletCarousel.vue';
import AppletCard from '@/components/Applet/AppletCard.vue';
// import CategoryList from '@/components/CategoryList.vue';

import { Button as DButton, Flex as DFlex, Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

const spotlightCategoryName = 'spotlight';
const starterPackCategoryName = 'starter pack';

// komt later...
// const mostInstalledItems = newlyAddedItems;

const isTimeOfTheYear = new Date().getMonth() === 11; // christmas + nye
// const isTimeOfTheYear = (new Date()).getMonth() === 7; // zomer + wk voetbal?

const mostSearchedTerms = ['clock', 'spotify', 'zapier', 'buienradar', 'bitcoin'];

const { isConnected, applets, isConnecting, lastError, connect, state } = useClientApi();
const canLoadStoreApplets = computed(() => isConnected.value);

const {
  data: newlyAddedItems,
  isLoading: isNewlyAddedLoading,
  error: newlyAddedError,
  isWaitingForPeer: isWaitingForNewlyAddedPeer,
  reload: reloadNewlyAdded
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage newly added',
  enabled: canLoadStoreApplets,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets)
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    const loadedApplets = await applets.getAllApplets();

    return (loadedApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load newly added applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Newly added applets loaded:', {
      count: loadedApplets.length
    });
  }
});

const {
  data: spotlightItems,
  isLoading: isSpotlightLoading,
  error: spotlightError,
  isWaitingForPeer: isWaitingForSpotlightPeer,
  reload: reloadSpotlight
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage spotlight',
  enabled: canLoadStoreApplets,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryName: spotlightCategoryName
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    const categoryApplets = await applets.getAppletsByCategoryName(spotlightCategoryName);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load spotlight applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Spotlight applets loaded:', {
      categoryName: spotlightCategoryName,
      count: loadedApplets.length
    });
  }
});

const {
  data: starterPackItems,
  isLoading: isStarterPackLoading,
  error: starterPackError,
  isWaitingForPeer: isWaitingForStarterPackPeer,
  reload: reloadStarterPack
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage starter pack',
  enabled: canLoadStoreApplets,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryName: starterPackCategoryName
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    const categoryApplets = await applets.getAppletsByCategoryName(starterPackCategoryName);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load starter pack applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Starter pack applets loaded:', {
      categoryName: starterPackCategoryName,
      count: loadedApplets.length
    });
  }
});

const themedItems = newlyAddedItems;
</script>

<template>
  <main class="site-wrapper">
    <div class="border">
      <pre>connection: {{ isConnected ? 'connected' : 'not connected' }}</pre>
      <pre>state: {{ state }}</pre>
      <pre v-if="isConnecting">connecting</pre>
      <pre v-if="lastError">{{ lastError }}</pre>
      <button v-if="!isConnected" class="btn" @click="connect">connect</button>
    </div>

    <DText is="h1" size="5xl" class="my-4">{{ toCapitalizeWords(String($route.name)) }}</DText>

    <section class="search my-4">
      <StoreSearch />

      <section class="my-2">
        <DFlex is="ul" wrap class="gap-1">
          <template v-for="term in mostSearchedTerms" :key="'search-' + term">
            <li>
              <DButton size="xs" color="neutral" @click="() => console.log(`click ${term}`)">{{
                term
              }}</DButton>
            </li>
          </template>
        </DFlex>
      </section>
    </section>

    <!-- (spotlight)<br />
    Kleine tiles met plaatje links en op max 2 lijnen titel rechts.<br />
    Tiles in grid van max 2 tiles hoog.

    <section>
      subtitel TITEL (categorie) (rechts uitgelijnd: show all knop)
      <div>
        tiles met grote plaat, onder titel op max 2 regels. na laatste zichtbare tile is de volgende
        voor 10% zichtbaar
      </div>
    </section> -->

    <StoreSection v-if="spotlightItems" title="[Spotlight]">
      <AppletCarousel :applets="spotlightItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet hasCategories>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <p v-else-if="isSpotlightLoading" class="m-4 text-center">Loading spotlight applets...</p>
    <p v-else-if="isWaitingForSpotlightPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="spotlightError" class="m-4 text-center">
      <p class="text-error">{{ spotlightError }}</p>
      <DButton size="xs" color="neutral" @click="reloadSpotlight">Retry</DButton>
    </div>

    <StoreSection
      v-if="isTimeOfTheYear && themedItems"
      title="[themed items]"
      payoff="[themed applets]"
    >
      <AppletCarousel :applets="themedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <StoreSection v-if="newlyAddedItems" title="[Newly Added]" payoff="[New applets added]">
      <AppletCarousel :applets="newlyAddedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <p v-else-if="isNewlyAddedLoading" class="m-4 text-center">Loading newly added applets...</p>
    <p v-else-if="isWaitingForNewlyAddedPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="newlyAddedError" class="m-4 text-center">
      <p class="text-error">{{ newlyAddedError }}</p>
      <DButton size="xs" color="neutral" @click="reloadNewlyAdded">Retry</DButton>
    </div>

    <!-- <StoreSection v-if="categories" title="Categories">
      <CategoryList :categories isInteractive />
    </StoreSection> -->

    <!-- mostInstalledItems komt later -->
    <!-- <StoreSection
      v-if="mostInstalledItems"
      title="[Most Installed]"
      payoff="[Most installed applets]"
    >
      <AppletCarousel :applets="mostInstalledItems">
        <template #item="applet">
          <AppletCard view="preview" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection> -->

    <StoreSection
      v-if="starterPackItems"
      title="[Starter Pack]"
      payoff="[Start here with these applets]"
    >
      <AppletCarousel :applets="starterPackItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <p v-else-if="isStarterPackLoading" class="m-4 text-center">Loading starter pack applets...</p>
    <p v-else-if="isWaitingForStarterPackPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="starterPackError" class="m-4 text-center">
      <p class="text-error">{{ starterPackError }}</p>
      <DButton size="xs" color="neutral" @click="reloadStarterPack">Retry</DButton>
    </div>

    <section>[Build your own applet! Submit it via Github]</section>
  </main>
</template>

<style scoped></style>
