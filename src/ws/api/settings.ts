/**
 * Settings API
 *
 * Provides methods for managing device settings like display brightness,
 * WiFi configuration, network settings, etc.
 */

import { ApiClientBase, type IRpcClient } from './client.ts';

export interface SettingsRecord {
  id?: number;
  key: string;
  value: string;
}

export interface WifiConfigureInput {
  ssid: string;
  security?: 'none' | 'wep' | 'wpa' | 'wpa23' | 'wpa3' | 'wpae' | 'wpa2e' | 'wpa3e';
  password?: string;
  hiddenNetwork?: boolean;
  dhcp?: 'dhcp' | 'static';
  ip?: string;
  subnet?: string;
  gateway?: string;
  dns?: 'auto' | 'manual';
  primaryDns?: string;
  secondaryDns?: string;
}

export interface WifiStatus {
  interface: string;
  configured: boolean;
  mode: 'client' | 'access-point' | 'disconnected' | 'unknown';
  activeConnection: string | null;
  ssid: string;
  security: WifiConfigureInput['security'] | 'unknown';
  signal: number | null;
  ipMode: WifiConfigureInput['dhcp'] | 'unknown';
  addresses: string[];
  gateway: string;
  dnsServers: string[];
  setupAccessPointSsid: string;
}

export interface WifiScanNetwork {
  bssid: string;
  ssid: string;
  security: string;
  signal: number | null;
  active: boolean;
}

interface SettingsActionResponse<T> {
  method: string;
  data: T;
}

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
    const response = await this.request<SettingsActionResponse<SettingsRecord | undefined>>(
      'settings.action',
      { method: 'getValue', params: { key } }
    );

    return response.data?.value as T;
  }

  /**
   * Set a specific setting value
   * @param key - The setting key
   * @param value - The value to set
   */
  async set<T = unknown>(key: string, value: T): Promise<SettingsRecord | undefined> {
    const response = await this.request<SettingsActionResponse<SettingsRecord | undefined>>(
      'settings.action',
      {
        method: 'setValue',
        params: { key, value }
      }
    );

    return response.data;
  }

  /**
   * Get all settings
   */
  async getAll(): Promise<SettingsRecord[]> {
    const response = await this.request<SettingsActionResponse<SettingsRecord[]>>(
      'settings.action',
      { method: 'getAll' }
    );

    return response.data;
  }

  async getWifiStatus(): Promise<WifiStatus> {
    const response = await this.request<SettingsActionResponse<WifiStatus>>(
      'settings.action',
      { method: 'getWifiStatus' }
    );

    return response.data;
  }

  async scanWifiNetworks(): Promise<WifiScanNetwork[]> {
    const response = await this.request<SettingsActionResponse<WifiScanNetwork[]>>(
      'settings.action',
      { method: 'scanWifiNetworks' }
    );

    return response.data;
  }

  async configureWifi(input: WifiConfigureInput): Promise<WifiStatus> {
    const response = await this.request<SettingsActionResponse<WifiStatus>>(
      'settings.action',
      { method: 'configureWifi', params: input }
    );

    return response.data;
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
