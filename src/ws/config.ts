import type { IWebSocketConfig } from 'pixelrunner-shared/lib/interfaces/index.ts';

export const DEFAULT_CONFIG: Required<IWebSocketConfig> = {
  url: 'ws://localhost:8765',
  reconnect: true,
  reconnectInterval: 1000, // 1 second
  reconnectMaxInterval: 30000, // 30 seconds
  reconnectDecay: 1.5, // exponential backoff multiplier
  maxReconnectAttempts: Infinity,
  timeout: 30000, // 30 seconds
  heartbeatInterval: 30000, // 30 seconds
  debug: true // process?.env?.DEV ?? false
};
