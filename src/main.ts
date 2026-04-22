// IMPORTANT: Import crypto polyfill FIRST, before any other imports
// This ensures crypto.subtle is available in insecure contexts (HTTP)
import './crypto-polyfill.ts';

import { createApp } from 'vue';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';

import App from './App.vue';
import router from './router/index.ts';
import { CookieStore } from './utils/CookieStore.ts';
import { WebSocketClient, WS_INJECTION_KEY } from '@/ws/index.ts';
import { TrysteroWebRTCClient } from '@/ws/trystero-client.ts';
import { NOSTR_RELAYS, ROOM_PREFIX } from './constants.ts';
import {
  detectAccessMode,
  requiresProxyConnection,
  markAsViaProxy
} from '@/utils/access-detector.ts';

import en from '../translations/en.json';
import de from '../translations/de.json';
import es from '../translations/es.json';
import nl from '../translations/nl.json';
import fr from '../translations/fr.json';

const NAMESPACE = 'translation';

i18next
  .init({
    lng: 'en',
    fallbackNS: NAMESPACE,

    resources: {
      en: { [NAMESPACE]: en },
      de: { [NAMESPACE]: de },
      es: { [NAMESPACE]: es },
      nl: { [NAMESPACE]: nl },
      fr: { [NAMESPACE]: fr }
    }
  })
  .then(() => {
    const app = createApp(App);

    // Detect access mode
    const accessMode = detectAccessMode();
    console.log('[main] Access mode:', accessMode);

    // Check if we're being proxied (via local IP)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('via') === 'proxy') {
      markAsViaProxy();
    }

    // Determine which WebSocket client to use
    let wsClient;

    console.log('requiresProxyConnection', requiresProxyConnection());

    if (requiresProxyConnection()) {
      // When accessed via local IP/proxy, use Trystero for P2P connection
      // The device will also connect via Trystero to establish P2P link
      console.log('[main] Using Trystero WebRTC client for proxy access');
      wsClient = new TrysteroWebRTCClient({
        roomId: `${ROOM_PREFIX}-${CookieStore.get('deviceId') || 'default'}`,
        relayUrls: [...NOSTR_RELAYS],
        debug: import.meta.env.DEV,
        reconnect: true
      });
    } else {
      // Standard WebSocket for local development
      console.log('[main] Using standard WebSocket client');
      wsClient = new WebSocketClient({
        url: `ws://${window.location.hostname}:8765`,
        debug: import.meta.env.DEV,
        reconnect: true
      });
    }

    // Provide WebSocket client to the app
    app.provide(WS_INJECTION_KEY, wsClient);

    // Provide access mode to the app
    app.provide('accessMode', accessMode);

    app.use(I18NextVue, { i18next });
    app.use(router);
    app.mount('#app');

    // Auto-connect WebSocket
    wsClient.connect().catch((err) => {
      console.error('Failed to connect to WebSocket:', err);
    });

    console.log('DIT IS IN MAIN', wsClient, wsClient.state.value);

    const languageFromCookie = CookieStore.get('language');
    if (languageFromCookie) {
      i18next.changeLanguage(languageFromCookie);
    }
  });

if (CookieStore.has('theme')) {
  document.documentElement.dataset.theme = CookieStore.get('theme') ?? 'pixelrunner';
}
