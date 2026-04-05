import type { WebSocketClient } from '../client.ts';

// /**
//  * Run settings action by providing the method name and optional parameters
//  * @param {string} method - The method to run
//  * @param {Record<string, unknown>} [params] - Optional parameters
//  */
// async settingsAction(method: string, params: Record<string, unknown>): Promise<UpdateResponse> {
//   return this.client.request<UpdateResponse>('settings.action', {
//     method,
//     params
//   });
// }

/**
 * SettingsAPI provides a foundation for managing device settings via WebSocket.
 * This class can be extended by adding specific methods for WiFi, network,
 * display settings, etc.
 *
 * Example usage:
 * ```typescript
 * // Get a specific setting
 * const brightness = await settings.get<number>('display.brightness');
 *
 * // Set a specific setting
 * await settings.set('display.brightness', 75);
 *
 * // Get all settings
 * const allSettings = await settings.getAll();
 * ```
 *
 * To add WiFi-specific methods, extend this class:
 * ```typescript
 * async setWiFi(config: WiFiConfig): Promise<void> {
 *   return this.client.request('settings.wifi.set', config);
 * }
 * ```
 */
export class SettingsAPI {
  constructor(private client: WebSocketClient) {}

  /**
   * Get a specific setting value
   * @param key - The setting key (e.g., 'display.brightness', 'wifi.ssid')
   * @returns The setting value
   */
  async get<T = unknown>(key: string): Promise<T> {
    return this.client.request<T>('settings.action', { method: 'getValue', params: { key } });
  }

  /**
   * Set a specific setting value
   * @param key - The setting key
   * @param value - The value to set
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    return this.client.request<void>('settings.action', {
      method: 'setValue',
      params: { key, value }
    });
  }

  /**
   * Get all settings
   * @returns Object containing all settings
   */
  async getAll(): Promise<Record<string, unknown>[]> {
    return this.client.request<Record<string, unknown>[]>('settings.action', { method: 'getAll' });
  }

  // /**
  //  * Subscribe to settings change events
  //  * @param handler - Callback function when settings change
  //  * @returns Unsubscribe function
  //  */
  // onSettingsChange(handler: (data: { key: string; value: unknown }) => void): () => void {
  //   return this.client.on('message:settings.changed', handler);
  // }

  // ============================================================================
  // Example methods that users can add for specific settings
  // ============================================================================

  /**
   * Example: Set WiFi configuration
   * Users can add similar methods for their specific settings needs
   *
   * @example
   * ```typescript
   * async setWiFi(config: WiFiConfig): Promise<void> {
   *   return this.client.request('settings.wifi.set', config);
   * }
   *
   * async getWiFi(): Promise<WiFiConfig> {
   *   return this.client.request('settings.wifi.get');
   * }
   * ```
   */

  /**
   * Example: Set network configuration
   *
   * @example
   * ```typescript
   * async setNetwork(config: NetworkConfig): Promise<void> {
   *   return this.client.request('settings.network.set', config);
   * }
   *
   * async getNetwork(): Promise<NetworkConfig> {
   *   return this.client.request('settings.network.get');
   * }
   * ```
   */

  /**
   * Example: Set display settings
   *
   * @example
   * ```typescript
   * async setDisplayBrightness(brightness: number): Promise<void> {
   *   return this.set('display.brightness', brightness);
   * }
   *
   * async getDisplayBrightness(): Promise<number> {
   *   return this.get<number>('display.brightness');
   * }
   * ```
   */
}
