import { inject } from 'vue';
import { DeviceAPI, AppletAPI, PlaylistsAPI, SettingsAPI } from '../api/index.ts';

import type { WebSocketClient } from '../client.ts';

export const WS_INJECTION_KEY = Symbol('websocket-client');

/**
 * Vue composable for accessing WebSocket functionality in components
 *
 * @example
 * ```typescript
 * import { useWebSocket } from '@/ws';
 *
 * const { device, isConnected, state } = useWebSocket();
 *
 * // Check connection
 * if (isConnected.value) {
 *   const status = await device.status();
 * }
 *
 * // Make requests
 * await device.print('Hello World!');
 *
 * // Subscribe to events
 * onMounted(() => {
 *   const unsubscribe = on('connected', () => {
 *     console.log('WebSocket connected!');
 *   });
 *
 *   onUnmounted(unsubscribe);
 * });
 * ```
 */
export function useWebSocket() {
  const client = inject<WebSocketClient>(WS_INJECTION_KEY);

  if (!client) {
    throw new Error(
      'WebSocket client not provided. Make sure to call app.provide(WS_INJECTION_KEY, wsClient) in main.ts'
    );
  }

  return {
    // Connection state
    state: client.state,
    isConnected: client.isConnected,
    isConnecting: client.isConnecting,
    lastError: client.lastError,

    // Methods
    request: client.request.bind(client),
    on: client.on.bind(client),
    off: client.off.bind(client),
    once: client.once.bind(client),
    connect: client.connect.bind(client),
    disconnect: client.disconnect.bind(client),
    reconnect: client.reconnect.bind(client),

    // API namespaces
    device: new DeviceAPI(client),
    applets: new AppletAPI(client),
    playlists: new PlaylistsAPI(client),
    settings: new SettingsAPI(client)
  };
}
