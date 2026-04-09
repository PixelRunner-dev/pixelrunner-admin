/**
 * Device API
 *
 * Provides methods for device management operations like status,
 * reboot, shutdown, firmware update, and factory reset.
 */

import { ApiClientBase, type IRpcClient } from './client.ts';
import type { DeviceStatusResponse, DeviceUpdateResponse } from '../types.ts';

/**
 * DeviceAPI provides device management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
 */
export class DeviceAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get the current device status
   */
  async status(): Promise<DeviceStatusResponse> {
    return this.request<DeviceStatusResponse>('device.status');
  }

  /**
   * Reboot the device
   */
  async reboot(): Promise<void> {
    return this.request<void>('device.reboot');
  }

  /**
   * Shutdown the device
   */
  async shutdown(): Promise<void> {
    return this.request<void>('device.shutdown');
  }

  /**
   * Update device firmware
   */
  async updateFirmware(): Promise<DeviceUpdateResponse> {
    return this.request<DeviceUpdateResponse>('device.updateFirmware');
  }

  /**
   * Run factory reset
   */
  async factoryReset(): Promise<void> {
    return this.request<void>('device.factoryReset');
  }

  // /**
  //  * Subscribe to device status change events
  //  * @param handler - Callback function when device status changes
  //  * @returns Unsubscribe function
  //  */
  // onStatusChange(handler: (status: DeviceStatusResponse) => void): () => void {
  //   return this.client.on('message:device.status_changed', handler);
  // }
}
