// IMPORTANT: Import crypto polyfill FIRST, before any other imports
// This ensures crypto.subtle is available in insecure contexts (HTTP)
import './crypto-polyfill.ts';

import { createApp } from 'vue';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';

import App from './App.vue';
import router from './router/index.ts';
import { CookieStore } from '@/utils/CookieStore.ts';
import { configureSetupStatusClient } from '@/services/setup-status.ts';
import { WebSocketClient, WS_INJECTION_KEY } from '@/ws/index.ts';
import { TrysteroWebRTCClient } from '@/ws/trystero-client.ts';
import { MockRpcClient } from '@/mocks/mock-rpc-client.ts';
import { NOSTR_RELAYS } from './constants.ts';
import { fetchProxyRoomConfig, getFallbackRoomId } from '@/ws/room-id.ts';
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
  .then(async () => {
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

    if (import.meta.env.VITE_MOCK_CONTROLLER === 'true') {
      console.log('[main] Using mock controller client');
      wsClient = new MockRpcClient();
    } else if (requiresProxyConnection()) {
      // When served by the device proxy, prefer a same-origin WebSocket bridge.
      // Trystero stays as the fallback for static/remote admin access.
      const proxyRoomConfig = await fetchProxyRoomConfig();
      if (proxyRoomConfig?.controllerWebSocketPath) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}${proxyRoomConfig.controllerWebSocketPath}`;
        console.log('[main] Using device proxy WebSocket client:', url);
        wsClient = new WebSocketClient({
          url,
          debug: import.meta.env.DEV,
          reconnect: true
        });
      } else {
        console.log('[main] Using Trystero WebRTC client for proxy access');
        wsClient = new TrysteroWebRTCClient({
          roomId: proxyRoomConfig?.roomId,
          fallbackRoomId: proxyRoomConfig?.fallbackRoomId ?? getFallbackRoomId(),
          roomPassword: proxyRoomConfig?.roomPassword,
          relayUrls: [...NOSTR_RELAYS],
          debug: import.meta.env.DEV,
          reconnect: true
        });
      }
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
    configureSetupStatusClient(wsClient);

    // Provide access mode to the app
    app.provide('accessMode', accessMode);

    app.use(I18NextVue, { i18next });
    app.use(router);
    app.mount('#app');

    wsClient.on('connected', (event) => {
      console.log('[main] Client connected:', event);
    });

    wsClient.on('disconnected', (event) => {
      console.log('[main] Client disconnected:', event);
    });

    wsClient.on('reconnecting', (event) => {
      console.log('[main] Client reconnecting:', event);
    });

    wsClient.on('error', (event) => {
      console.error('[main] Client error:', event.error);
    });

    // Auto-connect WebSocket
    wsClient.connect().catch((err) => {
      console.error('Failed to connect to WebSocket:', err);
    });

    const languageFromCookie = CookieStore.get('language');
    if (languageFromCookie) {
      i18next.changeLanguage(languageFromCookie);
    }
  });

if (CookieStore.has('theme')) {
  document.documentElement.dataset.theme = CookieStore.get('theme') ?? 'pixelrunner';
}
