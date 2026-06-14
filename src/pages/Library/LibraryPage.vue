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
import { t } from 'i18next';

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
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(spotlightCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.spotlight'),
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
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const loadedApplets = await applets.getAllApplets({
      sortOrder: 'DESC',
      limit: 10
    });

    return (loadedApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.new'),
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
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(starterPackCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.starterPack'),
  onSuccess: (loadedApplets) => {
    console.log('[LibraryPage] Starter pack applets loaded:', {
      categoryKey: starterPackCategoryKey,
      count: loadedApplets.length
    });
  }
});

const clockCategoryKey = 'clock';
const {
  data: clockItems,
  isLoading: isClockLoading,
  error: clockError,
  isWaitingForPeer: isWaitingForClockPeer,
  reload: reloadClock
} = useControllerQuery<IFullApplet[]>({
  label: 'LibraryPage - clock',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: clockCategoryKey
  }),
  load: async () => {
    if (!applets) {
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(clockCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.clock'),
  onSuccess: (loadedApplets) => {
    console.log('[LibraryPage] Clock applets loaded:', {
      categoryKey: clockCategoryKey,
      count: loadedApplets.length
    });
  }
});

const randomCategoryCandidates = [
  'bitcoin',
  'weather',
  'finance',
  'now_playing',
  'tracking',
  'smart_home',
  'gaming'
];
const randomIndex = Math.floor(Math.random() * randomCategoryCandidates.length);
const randomCategory = randomCategoryCandidates[randomIndex];

const {
  data: randomCategoryItems,
  isLoading: isRandomCategoryLoading,
  error: randomCategoryError,
  isWaitingForPeer: isWaitingForRandomCategoryPeer,
  reload: reloadRandomCategory
} = useControllerQuery<IFullApplet[]>({
  label: 'LibraryPage - randomCategory',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: randomCategory
  }),
  load: async () => {
    if (!applets) {
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(randomCategory);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.randomCategory'),
  onSuccess: (loadedApplets) => {
    console.log('[LibraryPage] randomCategory applets loaded:', {
      categoryKey: randomCategory,
      count: loadedApplets.length
    });
  }
});

const newsCategoryKey = 'news';
const {
  data: newsItems,
  isLoading: isNewsLoading,
  error: newsError,
  isWaitingForPeer: isWaitingForNewsPeer,
  reload: reloadNews
} = useControllerQuery<IFullApplet[]>({
  label: 'LibraryPage - news',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(applets),
  skipContext: () => ({
    hasAppletsApi: Boolean(applets),
    categoryKey: newsCategoryKey
  }),
  load: async () => {
    if (!applets) {
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const categoryApplets = await applets.getAppletsByCategoryKey(newsCategoryKey);

    return (categoryApplets ?? []) as IFullApplet[];
  },
  defaultErrorMessage: t('libraryPage.error.news'),
  onSuccess: (loadedApplets) => {
    console.log('[LibraryPage] news applets loaded:', {
      categoryKey: newsCategoryKey,
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
      throw new Error(t('generic.appletsApiUnavailable'));
    }

    const loadedCategories = await applets.getAllCategories();

    return (loadedCategories ?? []) as ICategory[];
  },
  defaultErrorMessage: t('libraryPage.error.categories'),
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

    <LibrarySection v-if="spotlightItems" :title="$t('libraryPage.spotlight.title')">
      <AppletCarousel :applets="spotlightItems" itemWidth="wide">
        <template #item="applet">
          <AppletCard view="preview" :applet hasCategories />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isSpotlightLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.spotlight') }}
    </p>
    <p v-else-if="isWaitingForSpotlightPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="spotlightError" class="m-4 text-center">
      <p class="text-error">{{ spotlightError }}</p>
      <DButton size="xs" color="neutral" @click="reloadSpotlight">{{
        $t('generic.retry')
      }}</DButton>
    </div>

    <!-- <LibrarySection
      v-if="isTimeOfTheYear && themedItems"
      :title="$t('libraryPage.themed.title')"
      :payoff="$t('libraryPage.themed.payoff')"
    >
      <AppletCarousel :applets="themedItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection> -->

    <LibrarySection
      v-if="newlyAddedItems"
      :title="$t('libraryPage.new.title')"
      :payoff="$t('libraryPage.new.payoff')"
    >
      <AppletCarousel :applets="newlyAddedItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isNewlyAddedLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.new') }}
    </p>
    <p v-else-if="isWaitingForNewlyAddedPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="newlyAddedError" class="m-4 text-center">
      <p class="text-error">{{ newlyAddedError }}</p>
      <DButton size="xs" color="neutral" @click="reloadNewlyAdded">{{
        $t('generic.retry')
      }}</DButton>
    </div>

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

    <p v-else-if="isStarterPackLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.starterPack') }}
    </p>
    <p v-else-if="isWaitingForStarterPackPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="starterPackError" class="m-4 text-center">
      <p class="text-error">{{ starterPackError }}</p>
      <DButton size="xs" color="neutral" @click="reloadStarterPack">{{
        $t('generic.retry')
      }}</DButton>
    </div>

    <LibrarySection v-if="categories" :title="$t('libraryPage.categories.title')">
      <CategoryList :categories isInteractive />
    </LibrarySection>

    <p v-else-if="isCategoriesLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.categories') }}
    </p>
    <p v-else-if="isWaitingForCategoriesPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="categoriesError" class="m-4 text-center">
      <p class="text-error">{{ categoriesError }}</p>
      <DButton size="xs" color="neutral" @click="reloadCategories">{{
        $t('generic.retry')
      }}</DButton>
    </div>

    <LibrarySection
      v-if="clockItems"
      :title="$t('libraryPage.clock.title')"
      :payoff="$t('libraryPage.clock.payoff')"
    >
      <AppletCarousel :applets="clockItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isClockLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.clock') }}
    </p>
    <p v-else-if="isWaitingForClockPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="clockError" class="m-4 text-center">
      <p class="text-error">{{ clockError }}</p>
      <DButton size="xs" color="neutral" @click="reloadClock">{{ $t('generic.retry') }}</DButton>
    </div>

    <LibrarySection
      v-if="randomCategoryItems"
      :title="$t(`libraryPage.${randomCategory}.title`)"
      :payoff="$t(`libraryPage.${randomCategory}.payoff`)"
    >
      <AppletCarousel :applets="randomCategoryItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isRandomCategoryLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.randomCategory') }}
    </p>
    <p v-else-if="isWaitingForRandomCategoryPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="randomCategoryError" class="m-4 text-center">
      <p class="text-error">{{ randomCategoryError }}</p>
      <DButton size="xs" color="neutral" @click="reloadRandomCategory">{{
        $t('generic.retry')
      }}</DButton>
    </div>

    <LibrarySection v-if="newsItems" :title="$t('libraryPage.news.title')">
      <AppletCarousel :applets="newsItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet />
        </template>
      </AppletCarousel>
    </LibrarySection>

    <p v-else-if="isNewsLoading" class="m-4 text-center">
      {{ $t('libraryPage.loading.news') }}
    </p>
    <p v-else-if="isWaitingForNewsPeer" class="m-4 text-center">
      {{ $t('generic.waitingForDevice') }}
    </p>
    <div v-else-if="newsError" class="m-4 text-center">
      <p class="text-error">{{ newsError }}</p>
      <DButton size="xs" color="neutral" @click="reloadNews">{{ $t('generic.retry') }}</DButton>
    </div>

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
