/**
 * Shared constants used across the application
 * for Trystero/WebRTC connections, WebSocket configuration, and API actions.
 */

import type { IWebSocketConfig } from 'pixelrunner-shared;

// ============================================================================
// Trystero/WebRTC Constants
// ============================================================================

/**
 * Default Nostr relay URLs for Trystero WebRTC signaling.
 * These are used for peer discovery and connection establishment.
 */
export const NOSTR_RELAYS = [
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
  'wss://nos.lol'
  // 'wss://relay.noderunners.network'
] as const;

/**
 * Application identifier used when creating Trystero rooms.
 * This helps identify and namespace the peer-to-peer connections.
 */
export const APP_ID = 'pixelrunner';

/**
 * The action name used for JSON-RPC communication over Trystero.
 * This is the channel name that both device and browser use to exchange RPC messages.
 */
export const ACTION_NAME = 'rpc';

/**
 * Default room prefix for Trystero rooms.
 */
export const ROOM_PREFIX = 'pixelrunner';

// ============================================================================
// WebSocket Configuration Constants
// ============================================================================

/**
 * Default WebSocket port for local development.
 */
export const DEFAULT_WS_PORT = 8765;

/**
 * Default WebSocket URL for local development.
 */
export const DEFAULT_WS_URL = `ws://localhost:${DEFAULT_WS_PORT}`;

export const DEFAULT_RECONNECT_INTERVAL = 1000;
export const DEFAULT_RECONNECT_MAX_INTERVAL = 30000;
export const DEFAULT_HEARTBEAT_INTERVAL = 30000;
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default WebSocket configuration.
 * Used as base config for both WebSocket and Trystero clients.
 */
export const DEFAULT_WEBSOCKET_CONFIG: Required<IWebSocketConfig> = {
  url: DEFAULT_WS_URL,
  reconnect: true,
  reconnectInterval: DEFAULT_RECONNECT_INTERVAL, // 1 second
  reconnectMaxInterval: DEFAULT_RECONNECT_MAX_INTERVAL, // 30 seconds
  reconnectDecay: 1.5, // exponential backoff multiplier
  // maxReconnectAttempts: Infinity,
  maxReconnectAttempts: 5,
  timeout: DEFAULT_TIMEOUT, // 30 seconds
  heartbeatInterval: DEFAULT_HEARTBEAT_INTERVAL, // 30 seconds
  debug: import.meta.env.DEV
};
