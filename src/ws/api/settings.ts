/**
 * Settings API
 *
 * Provides methods for managing device settings like display brightness,
 * WiFi configuration, network settings, etc.
 */

import { ApiClientBase, type IRpcClient } from './client.ts';

/**
 * SettingsAPI provides device settings management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
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
 */
export class SettingsAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get a specific setting value
   * @param key - The setting key (e.g., 'display.brightness', 'wifi.ssid')
   */
  async get<T = unknown>(key: string): Promise<T> {
    return this.request<T>('settings.action', { method: 'getValue', params: { key } });
  }

  /**
   * Set a specific setting value
   * @param key - The setting key
   * @param value - The value to set
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    return this.request<void>('settings.action', {
      method: 'setValue',
      params: { key, value }
    });
  }

  /**
   * Get all settings
   */
  async getAll(): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>('settings.action', { method: 'getAll' });
  }

  // /**
  //  * Subscribe to settings change events
  //  * @param handler - Callback function when settings change
  //  * @returns Unsubscribe function
  //  */
  // onSettingsChange(handler: (data: { key: string; value: unknown }) => void): () => void {
  //   return this.client.on('message:settings.changed', handler);
  // }
}
