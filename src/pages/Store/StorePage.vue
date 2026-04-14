<script setup lang="ts">
import {
  Button as DButton,
  Flex as DFlex,
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';

import StoreSearch from '@/components/Store/StoreSearch.vue';
import StoreSection from '@/components/Store/StoreSection.vue';
import AppletCarousel from '@/components/Applet/AppletCarousel.vue';
import AppletCard from '@/components/Applet/AppletCard.vue';
import CategoryList from '@/components/CategoryList.vue';

import { toCapitalizeWords } from '@/utils/generic.ts';
import type { ICategory, IFullApplet } from 'pixelrunner-shared';

const categories: ICategory[] = [
  {
    name: 'Memes',
    icon: {
      iconId: 'icon--masks-theater',
      alt: 'Memes'
    }
  },
  {
    name: 'Bitcoin',
    icon: {
      iconId: 'icon--bitcoin',
      alt: 'Bitcoin'
    }
  },
  {
    name: 'Clock',
    icon: {
      iconId: 'icon--clock',
      alt: 'Clock'
    }
  },
  {
    name: 'News',
    icon: {
      iconId: 'icon--newspaper',
      alt: 'News'
    }
  },
  {
    name: 'Weather',
    icon: {
      iconId: 'icon--cloud-sun-rain',
      alt: 'Weather'
    }
  },
  {
    name: 'Art',
    icon: {
      iconId: 'icon--paintbrush',
      alt: 'Art'
    }
  },
  {
    name: 'Social',
    icon: {
      iconId: 'icon--',
      alt: 'Social'
    }
  },
  {
    name: 'Pokémon',
    icon: {
      iconId: 'icon--pokemon',
      alt: 'Pokémon'
    }
  },
  {
    name: 'Sport & Fitness',
    icon: {
      iconId: 'icon--heart-pusle',
      alt: 'Sport'
    }
  },
  {
    name: 'Productivity',
    icon: {
      iconId: 'icon--handshake',
      alt: 'Productivity'
    }
  },
  {
    name: 'Home automation',
    icon: {
      iconId: 'icon--home-laptop',
      alt: 'Home automation'
    }
  },
  {
    name: 'Now playing',
    icon: {
      iconId: 'icon--music',
      alt: 'Now'
    }
  },
  {
    name: 'Made for devs',
    icon: {
      iconId: 'icon--code',
      alt: 'Made'
    }
  },
  {
    name: 'Gaming',
    icon: {
      iconId: 'icon--gamepad',
      alt: 'Gaming'
    }
  },
  {
    name: 'Customization',
    icon: {
      iconId: 'icon--wand-magic-sparkles',
      alt: 'Customization'
    }
  },
  {
    name: 'Religion',
    icon: {
      iconId: 'icon--person-praying',
      alt: 'Religion'
    }
  }
];

const newlyAddedItems: IFullApplet[] = [
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 1',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: true
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[1] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 2',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[1] as ICategory, categories[2] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 3',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[3] as ICategory, categories[2] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 4',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[1] as ICategory, categories[2] as ICategory, categories[3] as ICategory, categories[4] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 5',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[4] as ICategory, categories[5] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 6',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[3] as ICategory, categories[5] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 7',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[6] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 8',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[1] as ICategory, categories[5] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 9',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[6] as ICategory, categories[7] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 10',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[7] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 11',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[6] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 12',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[1] as ICategory, categories[5] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 13',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[4] as ICategory, categories[5] as ICategory, categories[8] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 14',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[6] as ICategory, categories[7] as ICategory, categories[8] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 15',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[3] as ICategory, categories[6] as ICategory, categories[7] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 16',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 17',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[5] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 18',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[1] as ICategory, categories[4] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 19',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[0] as ICategory, categories[1] as ICategory, categories[2] as ICategory, categories[3] as ICategory, categories[4] as ICategory, categories[5] as ICategory, categories[6] as ICategory, categories[7] as ICategory, categories[8] as ICategory]
  },
  {
    fileName: 'file-name.webp',
    packageName: 'myApp',
    defaultImage: {
      src: 'https://picsum.photos/64/32',
      alt: 'alt',
      dateCreated: new Date()
    },
    details: {
      name: 'name 20',
      summary: 'bla die bla',
      desc: 'nog meer bla die bla dus',
      author: '@truus',
      tags: ['tag 1', 'tag 2'],
      isOfficialApplet: false
    },
    isInstalled: false,
    categories: [categories[8] as ICategory]
  }
];

const spotlightItems = newlyAddedItems;
const mostInstalledItems = newlyAddedItems;
const starterPackItems = newlyAddedItems;

const mostSearchedTerms = ['clock', 'spotify', 'zapier', 'buienradar', 'bitcoin'];
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">{{ toCapitalizeWords(String($route.name)) }}</DText>

    <section class="search my-4">
      <StoreSearch />

      <section class="my-2">
        <DFlex is="ul" wrap class="gap-1">
          <template v-for="term in mostSearchedTerms" :key="'search-' + term">
            <li>
              <DButton size="xs" color="neutral" @click="() => (console.log(`click ${term}`))">{{ term }}</DButton>
            </li>
          </template>
        </DFlex>
      </section>
    </section>


    (spotlight)<br />
    Kleine tiles met plaatje links en op max 2 lijnen titel rechts.<br />
    Tiles in grid van max 2 tiles hoog.

    <section>
      subtitel TITEL (categorie) (rechts uitgelijnd: show all knop)
      <div>
        tiles met grote plaat, onder titel op max 2 regels. na laatste zichtbare tile is de volgende
        voor 10% zichtbaar
      </div>
    </section>

    <StoreSection v-if="spotlightItems" title="Spotlight">
      <AppletCarousel :applets="spotlightItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet hasCategories>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <StoreSection v-if="newlyAddedItems" title="Newly Added" payoff="New applets added">
      <AppletCarousel :applets="newlyAddedItems">
        <template #item="applet">
          <AppletCard view="preview" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <StoreSection v-if="categories" title="Categories">
      <CategoryList :categories isInteractive />
    </StoreSection>

    <StoreSection v-if="mostInstalledItems" title="Most Installed" payoff="Most installed applets">
      <AppletCarousel :applets="mostInstalledItems">
        <template #item="applet">
          <AppletCard view="preview" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <StoreSection
      v-if="starterPackItems"
      title="Starter Pack"
      payoff="Start here with these applets"
    >
      <AppletCarousel :applets="starterPackItems">
        <template #item="applet">
          <AppletCard view="vertical" :applet>
            <template #cta>[test]</template>
          </AppletCard>
        </template>
      </AppletCarousel>
    </StoreSection>

    <section>[Build your own applet! Submit it via Github]</section>
  </main>
</template>

<style scoped></style>
