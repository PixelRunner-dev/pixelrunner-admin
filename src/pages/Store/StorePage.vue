<script setup lang="ts">
import type { IFullApplet } from 'pixelrunner-shared';

import { useClientApi } from '@/ws/index.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';

import StoreSearch from '@/components/Store/StoreSearch.vue';
import StoreSection from '@/components/Store/StoreSection.vue';
import AppletCarousel from '@/components/Applet/AppletCarousel.vue';
import AppletCard from '@/components/Applet/AppletCard.vue';
// import CategoryList from '@/components/CategoryList.vue';
import DebugSection from '@/components/DebugSection.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';

import { Button as DButton, Flex as DFlex, Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

const isTimeOfTheYear = new Date().getMonth() === 11; // christmas + nye
// const isTimeOfTheYear = (new Date()).getMonth() === 7; // zomer + wk voetbal?

const mostSearchedTerms = ['clock', 'spotify', 'zapier', 'buienradar', 'bitcoin'];

const { isConnected, applets, isConnecting, lastError, state } = useClientApi();

const spotlightCategoryKey = 'spotlight';
const {
  data: spotlightItems,
  isLoading: isSpotlightLoading,
  error: spotlightError,
  isWaitingForPeer: isWaitingForSpotlightPeer,
  reload: reloadSpotlight
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage - spotlight',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: spotlightCategoryKey
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(spotlightCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load spotlight applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Spotlight applets loaded:', {
      categoryKey: spotlightCategoryKey,
      count: loadedApplets.length
    });
  }
});

const {
  data: newlyAddedItems,
  isLoading: isNewlyAddedLoading,
  error: newlyAddedError,
  isWaitingForPeer: isWaitingForNewlyAddedPeer,
  reload: reloadNewlyAdded
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage - newlyAdded',
  enabled: isConnected,
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

    const loadedApplets = await applets.getAllApplets({
      sortOrder: 'DESC',
      limit: 10
    });

    return (loadedApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load newly added applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Newly added applets loaded:', {
      count: loadedApplets.length
    });
  }
});

const starterPackCategoryKey = 'starter_pack';
const {
  data: starterPackItems,
  isLoading: isStarterPackLoading,
  error: starterPackError,
  isWaitingForPeer: isWaitingForStarterPackPeer,
  reload: reloadStarterPack
} = useControllerQuery<IFullApplet[]>({
  label: 'StorePage - starterPack',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: starterPackCategoryKey
  }),
  load: async () => {
    if (!applets) {
      throw new Error('Applets API not available');
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(starterPackCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: 'Failed to load starter pack applets',
  onSuccess: (loadedApplets) => {
    console.log('[StorePage] Starter pack applets loaded:', {
      categoryKey: starterPackCategoryKey,
      count: loadedApplets.length
    });
  }
});

const themedItems = newlyAddedItems;
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">{{ $t('storePage.pageTitle') }}</DText>

    <section class="search my-4">
      <FeatureToggle features="search">
        <StoreSearch />

        <FeatureToggle :features="['search', 'topSearchQueries']">
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
        </FeatureToggle>
      </FeatureToggle>
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

    <StoreSection v-if="spotlightItems" :title="$t('storePage.spotlight.title')">
      <AppletCarousel :applets="spotlightItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet hasCategories />
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
          <AppletCard view="preview" :applet />
        </template>
      </AppletCarousel>
    </StoreSection>

    <StoreSection v-if="newlyAddedItems" :title="$t('storePage.new.title')" :payoff="$t('storePage.new.payoff')">
      <AppletCarousel itemWidth="wide" :applets="newlyAddedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet />
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
      :title="$t('storePage.starterPack.title')"
      :payoff="$t('storePage.starterPack.payoff')"
    >
      <AppletCarousel :applets="starterPackItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </StoreSection>

    <p v-else-if="isStarterPackLoading" class="m-4 text-center">Loading starter pack applets...</p>
    <p v-else-if="isWaitingForStarterPackPeer" class="m-4 text-center">
      [Waiting for device connection...]
    </p>
    <div v-else-if="starterPackError" class="m-4 text-center">
      <p class="text-error">{{ starterPackError }}</p>
      <DButton size="xs" color="neutral" @click="reloadStarterPack">Retry</DButton>
    </div>

    <section>[Build your own applet! Submit it via Github]</section>

    <FeatureToggle features="debug">
      <DebugSection :data="{
        isConnecting,
        isConnected,
        lastError,
        spotlight: {
          spotlightItems: spotlightItems?.length,
          isSpotlightLoading,
          spotlightError,
          isWaitingForSpotlightPeer,
          spotlightCategoryKey
        },
        newlyAdded: {
          newlyAddedItems: newlyAddedItems?.length,
          isNewlyAddedLoading,
          newlyAddedError,
          isWaitingForNewlyAddedPeer
        },
        starterPack: {
          starterPackItems: starterPackItems?.length,
          isStarterPackLoading,
          starterPackError,
          isWaitingForStarterPackPeer,
          starterPackCategoryKey
        }
      }" />
    </FeatureToggle>
  </main>
</template>
