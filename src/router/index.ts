import {
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType
} from 'vue-router';

import { isSetupRequired } from '@/services/setup-status.ts';

const APP_TITLE = document.title;

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/applets' },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/pages/SetupPage.vue'),
      meta: { title: 'Setup' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { title: 'Settings' }
    },
    {
      path: '/update',
      name: 'update',
      component: () => import('@/pages/UpdatePage.vue'),
      meta: { title: 'Update' }
    },
    {
      path: '/applets',
      name: 'applet-list',
      component: () => import('@/pages/Applets/ListPage.vue'),
      meta: { title: 'Applets' }
    },
    {
      path: '/applets/:uuid',
      name: 'applet-detail',
      component: () => import('@/pages/Applets/DetailPage.vue'),
      meta: { title: 'Applet' }
    },
    {
      path: '/store',
      name: 'store',
      component: () => import('@/pages/Store/StorePage.vue'),
      meta: { title: 'Store' }
    },
    {
      path: '/store/categories/:name',
      name: 'store-category',
      component: () => import('@/pages/Store/SearchPage.vue'),
      meta: { title: 'Store Search' }
    },
    {
      path: '/store/search',
      name: 'store-search',
      component: () => import('@/pages/Store/SearchPage.vue'),
      meta: { title: 'Store Search' }
    },
    { path: '/store/applets', redirect: '/store' },
    {
      path: '/store/applets/:packageName',
      name: 'store-detail',
      component: () => import('@/pages/Applets/DetailPage.vue'),
      meta: { title: 'Applet' }
    }
  ]
});

router.beforeEach(async (to) => {
  const setupRequired = await isSetupRequired().catch(() => null);

  if (to.name !== 'setup' && setupRequired) {
    return { name: 'setup' };
  }

  if (to.name === 'setup' && setupRequired === false) {
    return { name: 'applet-list' };
  }

  if (to.meta.title) {
    document.title = `${to.meta.title} - ${APP_TITLE}`;
  }
});

router.afterEach((_to, _from, failure) => {
  if (
    failure &&
    !isNavigationFailure(
      failure,
      NavigationFailureType.cancelled | NavigationFailureType.duplicated
    )
  ) {
    console.error('route failure', failure);
    // sendToAnalytics(to, from, failure)
  }
});

export default router;
