// Client implementations
export { WebSocketClient } from './client.ts';
export { TrysteroWebRTCClient } from './trystero-client.ts';
export type { TrysteroConfig } from './trystero-client.ts';

// Base classes
export { BaseWebSocketClient } from './base-client.ts';

// Errors
export {
  WebSocketError,
  WebSocketTimeoutError,
  WebSocketConnectionError,
  JsonRpcError
} from './errors.ts';

// Config
export { DEFAULT_WEBSOCKET_CONFIG as DEFAULT_CONFIG } from '../constants.ts';
export type { IWebSocketConfig } from 'pixelrunner-shared';

// Types
export * from './types.ts';

// RPC utilities
export * from './rpc/message-handler.ts';
export * from './rpc/action.ts';

// API - Client interfaces and classes
export * from './api/index.ts';

// Composables
export * from './composables/index.ts';

// Backwards compatibility - alias useClientApi as useWebSocket
export { useClientApi as useWebSocket } from './composables/index.ts';
