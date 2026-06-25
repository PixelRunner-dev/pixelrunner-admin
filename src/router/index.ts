import {
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType
} from 'vue-router';

import i18next, { t } from 'i18next';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/applets' },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { titleKey: 'routeTitle.settings' }
    },
    {
      path: '/update',
      name: 'update',
      component: () => import('@/pages/UpdatePage.vue'),
      meta: { titleKey: 'routeTitle.update' }
    },
    {
      path: '/applets',
      name: 'applet-list',
      component: () => import('@/pages/Applets/ListPage.vue'),
      meta: { titleKey: 'routeTitle.appletList' }
    },
    {
      path: '/applets/:uuid',
      name: 'applet-detail',
      component: () => import('@/pages/Applets/DetailPage.vue'),
      meta: { titleKey: 'routeTitle.appletDetail' }
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/pages/Library/LibraryPage.vue'),
      meta: { titleKey: 'routeTitle.library' }
    },
    { path: '/library/categories', redirect: '/library' },
    {
      path: '/library/categories/:categoryKey',
      name: 'library-category',
      component: () => import('@/pages/CategoryPage.vue'),
      meta: { titleKey: 'routeTitle.category' }
    },
    {
      path: '/library/search',
      name: 'library-search',
      component: () => import('@/pages/Library/SearchPage.vue'),
      meta: { titleKey: 'routeTitle.search' }
    },
    { path: '/library/applets', redirect: '/library' },
    {
      path: '/library/applets/:packageName',
      name: 'library-detail',
      component: () => import('@/pages/Applets/DetailPage.vue'),
      meta: { titleKey: 'routeTitle.appletDetail' }
    }
  ]
});

function applyDocumentTitle(titleKey: unknown): void {
  const baseTitle = t('documentTitle');
  document.title = typeof titleKey === 'string' ? `${t(titleKey)} - ${baseTitle}` : baseTitle;
}

router.beforeEach((to) => {
  applyDocumentTitle(to.meta.titleKey);
});

// Re-localize the current route's document title when the language changes.
i18next.on('languageChanged', () => {
  applyDocumentTitle(router.currentRoute.value.meta.titleKey);
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
