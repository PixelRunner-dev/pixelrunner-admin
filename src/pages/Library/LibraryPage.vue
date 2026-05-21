<script setup lang="ts">
import type { ICategory, IFullApplet } from 'pixelrunner-shared';

import { useClientApi } from '@/ws/index.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';

import LibrarySearch from '@/components/Library/LibrarySearch.vue';
import LibrarySection from '@/components/Library/LibrarySection.vue';
import AppletCarousel from '@/components/Applet/AppletCarousel.vue';
import AppletCard from '@/components/Applet/AppletCard.vue';
import CategoryList from '@/components/CategoryList.vue';
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
  label: 'LibraryPage - spotlight',
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
    console.log('[LibraryPage] Spotlight applets loaded:', {
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
  label: 'LibraryPage - newlyAdded',
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
    console.log('[LibraryPage] Newly added applets loaded:', {
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
  label: 'LibraryPage - starterPack',
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
    console.log('[LibraryPage] Starter pack applets loaded:', {
      categoryKey: starterPackCategoryKey,
      count: loadedApplets.length
    });
  }
});

const {
  data: categories,
  isLoading: isCategoriesLoading,
  error: categoriesError,
  isWaitingForPeer: isWaitingForCategoriesPeer,
  reload: reloadCategories
} = useControllerQuery<ICategory[]>({
  label: 'LibraryPage - categories',
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

    const loadedCategories = await applets.getAllCategories();

    return (loadedCategories ?? []) as ICategory[];
  },
  defaultErrorMessage: 'Failed to load categories',
  onSuccess: (loadedCategories) => {
    console.log('[LibraryPage] Categories loaded:', {
      count: loadedCategories.length
    });
  }
});

const themedItems = newlyAddedItems;
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">{{ $t('libraryPage.pageTitle') }}</DText>

    <section class="search my-4">
      <FeatureToggle features="search">
        <LibrarySearch />

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

    <LibrarySection v-if="spotlightItems" :title="$t('libraryPage.spotlight.title')">
      <AppletCarousel :applets="spotlightItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet hasCategories />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isSpotlightLoading" class="m-4 text-center">Loading spotlight applets...</p>
    <p v-else-if="isWaitingForSpotlightPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="spotlightError" class="m-4 text-center">
      <p class="text-error">{{ spotlightError }}</p>
      <DButton size="xs" color="neutral" @click="reloadSpotlight">Retry</DButton>
    </div>

    <LibrarySection
      v-if="isTimeOfTheYear && themedItems"
      title="[themed items]"
      payoff="[themed applets]"
    >
      <AppletCarousel :applets="themedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <LibrarySection
      v-if="newlyAddedItems"
      :title="$t('libraryPage.new.title')"
      :payoff="$t('libraryPage.new.payoff')"
    >
      <AppletCarousel itemWidth="wide" :applets="newlyAddedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isNewlyAddedLoading" class="m-4 text-center">Loading newly added applets...</p>
    <p v-else-if="isWaitingForNewlyAddedPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="newlyAddedError" class="m-4 text-center">
      <p class="text-error">{{ newlyAddedError }}</p>
      <DButton size="xs" color="neutral" @click="reloadNewlyAdded">Retry</DButton>
    </div>

    <LibrarySection v-if="categories" :title="$t('libraryPage.categories.title')">
      <CategoryList :categories isInteractive />
    </LibrarySection>

    <p v-else-if="isCategoriesLoading" class="m-4 text-center">Loading categories...</p>
    <p v-else-if="isWaitingForCategoriesPeer" class="m-4 text-center">
      Waiting for device connection...
    </p>
    <div v-else-if="categoriesError" class="m-4 text-center">
      <p class="text-error">{{ categoriesError }}</p>
      <DButton size="xs" color="neutral" @click="reloadCategories">Retry</DButton>
    </div>

    <!-- mostInstalledItems komt later -->
    <!-- <LibrarySection
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
    </LibrarySection> -->

    <LibrarySection
      v-if="starterPackItems"
      :title="$t('libraryPage.starterPack.title')"
      :payoff="$t('libraryPage.starterPack.payoff')"
    >
      <AppletCarousel :applets="starterPackItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

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
      <DebugSection
        :data="{
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
          },
          categories: {
            categories: categories?.length,
            isCategoriesLoading,
            categoriesError,
            isWaitingForCategoriesPeer
          }
        }"
      />
    </FeatureToggle>
  </main>
</template>
