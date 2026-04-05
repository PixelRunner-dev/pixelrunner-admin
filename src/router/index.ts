import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/pages/SettingsPage.vue'),
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

const hasDeviceConfigured = true;

router.beforeEach((to, _from, next) => {
  if (to.name !== 'setup' && !hasDeviceConfigured) {
    router.push('/setup');
  }

  if (to.name === 'setup' && hasDeviceConfigured) {
    router.push('/applets');
  }

  if (to.path === '/') {
    router.push('/applets');
  }

  if (to.meta.title) {
    document.title = `${to.meta.title} - ${document.title}`;
  }

  next();
});

router.afterEach((_to, _from, failure) => {
  if (failure) {
    console.error('route failure', failure);
    // sendToAnalytics(to, from, failure)
  }
});

export default router;
