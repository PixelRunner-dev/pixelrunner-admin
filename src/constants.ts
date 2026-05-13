/**
 * Shared constants used across the application
 * for Trystero/WebRTC connections, WebSocket configuration, and API actions.
 */

import type { IWebSocketConfig } from 'pixelrunner-shared';

// ============================================================================
// Trystero/WebRTC Constants
// ============================================================================

/**
 * Default Nostr relay URLs for Trystero WebRTC signaling.
 * These are used for peer discovery and connection establishment.
 * Using relays that don't require PoW and are more reliable.
 */
export const NOSTR_RELAYS = [
  'wss://relay.primal.net',
  'wss://nostr-relay.psfoundation.info'
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

/**
 * Default device identifier used when no per-device identifier is available.
 * Must match the device proxy fallback default.
 */
export const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'pxlr_f91a';

/**
 * Development fallback. Production devices return a per-device room password
 * from /.pixelrunner/proxy-config when the admin UI is served through the proxy.
 */
export const ROOM_PASSWORD = import.meta.env.ROOM_PASSWORD || 'your-secure-password-change-me';

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
  debug: import.meta.env.DEV || false
};

export const THEMES_DARK = [
  'dark',
  'business',
  'dracula',
  'abyss',
  'night',
  'halloween',
  'dim',
  'sunset',
  'forest',
  'coffee',
  'luxury',
  'black'
];

export const THEMES_LIGHT = [
  'pixelrunner',
  'light',
  'emerald',
  'garden',
  'pastel',
  'autumn',
  'cupcake',
  'nord',
  'bumblebee',
  'corporate',
  'fantasy',
  'acid',
  'cmyk',
  'winter',
  'silk',
  'lofi',
  'wireframe'
];

export const THEMES_OTHER = [
  'synthwave',
  'aqua',
  'cyberpunk',
  'retro',
  'valentine',
  'caramellatte',
  'lemonade'
];

export const THEME_DEFAULT = 'pixelrunner';
