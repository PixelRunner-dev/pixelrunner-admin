// Client
export { WebSocketClient } from './client.ts';
export { TrysteroWebRTCClient } from './trystero-client.ts';
export type { TrysteroConfig } from './trystero-client.ts';

// APIs
export { DeviceAPI, AppletAPI, SettingsAPI, PlaylistsAPI } from './api/index.ts';

// Composables
export { useWebSocket, WS_INJECTION_KEY } from './composables/index.ts';

// Errors
export { WebSocketError, WebSocketTimeoutError, WebSocketConnectionError } from './errors.ts';
