/**
 * useClient - Composable for accessing WebSocket/Trystero clients
 *
 * This composable provides a unified interface for accessing either
 * a WebSocket or Trystero WebRTC client in Vue components. It automatically
 * detects which client has been provided and returns the appropriate interface.
 */

import { inject, computed, type Ref, type ComputedRef } from 'vue';
import { type IRpcClient } from '../api/client.ts';
import { DeviceAPI } from '../api/device.ts';
import { AppletAPI } from '../api/applets.ts';
import { SettingsAPI } from '../api/settings.ts';
import { PlaylistsAPI } from '../api/playlists.ts';
import type {
  IConnectionState,
  IWebSocketEventType,
  IEventHandler,
  IJsonRpcParams,
  IRequestOptions
} from 'pixelrunner-shared/lib/interfaces/index.ts';

// Injection keys for different client types
export const WS_INJECTION_KEY = Symbol('websocket-client');
export const TRYSTERO_INJECTION_KEY = Symbol('trystero-client');

/**
 * Return type for the useClient composable
 */
export interface UseClientReturn {
  /** Current connection state */
  state: Ref<IConnectionState>;
  /** Whether the client is connected */
  isConnected: ComputedRef<boolean>;
  /** Whether the client is connecting */
  isConnecting: ComputedRef<boolean>;
  /** Last error that occurred */
  lastError: Ref<Error | null>;
  /** Make an RPC request */
  request: <T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions
  ) => Promise<T>;
  /** Subscribe to events */
  on: <K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>) => () => void;
  /** Unsubscribe from events */
  off: <K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>) => void;
  /** Subscribe to event once */
  once: <K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>) => void;
  /** Connect to the server */
  connect: () => Promise<void>;
  /** Disconnect from the server */
  disconnect: () => void;
  /** Reconnect to the server */
  reconnect: () => Promise<void>;
  /** The underlying client instance */
  client: IRpcClient | null;
  /** The type of client being used */
  clientType: 'websocket' | 'trystero' | null;
}

/**
 * Composable for accessing the WebSocket or Trystero client.
 *
 * Usage:
 * ```typescript
 * import { useClient } from '@/ws/composables/use-client';
 *
 * const { isConnected, request, on } = useClient();
 *
 * // Make API calls
 * const status = await request('device.status');
 *
 * // Subscribe to events
 * const unsub = on('connected', () => console.log('Connected!'));
 * ```
 *
 * @throws Error if neither WebSocket nor Trystero client has been provided
 */
export function useClient(): UseClientReturn {
  // Try to inject both client types
  const wsClient = inject<IRpcClient | null>(WS_INJECTION_KEY, null);
  const trysteroClient = inject<IRpcClient | null>(TRYSTERO_INJECTION_KEY, null);

  // Determine which client to use
  const client = wsClient || trysteroClient;

  if (!client) {
    throw new Error(
      'No WebSocket or Trystero client provided. ' +
        'Make sure to call app.provide(WS_INJECTION_KEY, wsClient) or ' +
        'app.provide(TRYSTERO_INJECTION_KEY, trysteroClient) in main.ts'
    );
  }

  // Determine client type
  const clientType = wsClient ? 'websocket' : 'trystero';

  return {
    // State
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

    // Additional info
    client,
    clientType
  };
}

/**
 * Composable for optionally accessing the client (no error if not provided).
 * Returns null if neither client is available.
 *
 * Usage:
 * ```typescript
 * const client = useOptionalClient();
 * if (client) {
 *   const status = await client.request('device.status');
 * }
 * ```
 */
export function useOptionalClient(): UseClientReturn | null {
  const wsClient = inject<IRpcClient | null>(WS_INJECTION_KEY, null);
  const trysteroClient = inject<IRpcClient | null>(TRYSTERO_INJECTION_KEY, null);

  if (!wsClient && !trysteroClient) {
    return null;
  }

  const client = wsClient || trysteroClient!;
  const clientType = wsClient ? 'websocket' : 'trystero';

  return {
    state: client.state,
    isConnected: client.isConnected,
    isConnecting: client.isConnecting,
    lastError: client.lastError,
    request: client.request.bind(client),
    on: client.on.bind(client),
    off: client.off.bind(client),
    once: client.once.bind(client),
    connect: client.connect.bind(client),
    disconnect: client.disconnect.bind(client),
    reconnect: client.reconnect.bind(client),
    client,
    clientType
  };
}

/**
 * API instance types
 */
export type DeviceAPIInstance = InstanceType<typeof DeviceAPI>;
export type AppletAPIInstance = InstanceType<typeof AppletAPI>;
export type SettingsAPIInstance = InstanceType<typeof SettingsAPI>;
export type PlaylistsAPIInstance = InstanceType<typeof PlaylistsAPI>;

/**
 * Composable that provides API instances using the available client.
 * This is a convenience wrapper that combines client access with API creation.
 */
export interface UseClientApiReturn {
  /** The client state */
  state: Ref<IConnectionState>;
  isConnected: ComputedRef<boolean>;
  isConnecting: ComputedRef<boolean>;
  lastError: Ref<Error | null>;

  // API instances (will be null if client not available)
  device: DeviceAPIInstance | null;
  applets: AppletAPIInstance | null;
  settings: SettingsAPIInstance | null;
  playlists: PlaylistsAPIInstance | null;

  // Client methods
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

/**
 * Get API instances from the available client.
 */
export function useClientApi(): UseClientApiReturn {
  const clientReturn = useOptionalClient();

  if (!clientReturn) {
    // Return a structure with null APIs
    return {
      state: { value: 'disconnected' } as Ref<IConnectionState>,
      isConnected: computed(() => false),
      isConnecting: computed(() => false),
      lastError: { value: null } as Ref<Error | null>,
      device: null,
      applets: null,
      settings: null,
      playlists: null,
      connect: () => Promise.reject(new Error('No client available')),
      disconnect: () => {},
      reconnect: () => Promise.reject(new Error('No client available'))
    };
  }

  const { state, isConnected, isConnecting, lastError, connect, disconnect, reconnect, client } =
    clientReturn;

  // Client is guaranteed non-null here because useOptionalClient returns null when no client
  const clientInstance: IRpcClient = client as IRpcClient;

  // Create API instances
  const device = new DeviceAPI(clientInstance);
  const applets = new AppletAPI(clientInstance);
  const settings = new SettingsAPI(clientInstance);
  const playlists = new PlaylistsAPI(clientInstance);

  return {
    state,
    isConnected,
    isConnecting,
    lastError,
    device,
    applets,
    settings,
    playlists,
    connect,
    disconnect,
    reconnect
  };
}
