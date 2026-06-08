import {
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType
} from 'vue-router';

import { getSetupRedirect } from '@/services/setup-status.ts';

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
      path: '/library',
      name: 'library',
      component: () => import('@/pages/Library/LibraryPage.vue'),
      meta: { title: 'Library' }
    },
    { path: '/library/categories', redirect: '/library' },
    {
      path: '/library/categories/:categoryKey',
      name: 'library-category',
      component: () => import('@/pages/CategoryPage.vue'),
      meta: { title: 'Category' }
    },
    {
      path: '/library/search',
      name: 'library-search',
      component: () => import('@/pages/Library/SearchPage.vue'),
      meta: { title: 'Library Search' }
    },
    { path: '/library/applets', redirect: '/library' },
    {
      path: '/library/applets/:packageName',
      name: 'library-detail',
      component: () => import('@/pages/Applets/DetailPage.vue'),
      meta: { title: 'Applet' }
    }
  ]
});

router.beforeEach(async (to) => {
  const redirect = await getSetupRedirect(to).catch(() => null);

  if (redirect) {
    return redirect;
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
