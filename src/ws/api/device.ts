/**
 * Device API
 *
 * Provides methods for device management operations like status,
 * reboot, shutdown, firmware update, and factory reset.
 */

import { ApiClientBase, type IRpcClient } from './client.ts';
import type { DeviceStatusResponse, DeviceUpdateResponse } from '../types.ts';
import type { DatabaseMigrationResult } from '@/services/device-maintenance.ts';
import type { SetupStatus } from '@/services/setup-status.ts';
import type { IRequestOptions } from 'pixelrunner-shared';

export interface DeviceStatusOptions extends Record<string, unknown> {
  full?: boolean;
}

/**
 * DeviceAPI provides device management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
 */
export class DeviceAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get the current device status
   */
  async status(options?: DeviceStatusOptions): Promise<DeviceStatusResponse> {
    return this.request<DeviceStatusResponse>('device.status', options);
  }

  /**
   * Get first-time setup status.
   */
  async setupStatus(): Promise<SetupStatus> {
    return this.request<SetupStatus>('device.setupStatus');
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

  /**
   * Run database migrations on the device.
   */
  async migrateDatabase(options?: IRequestOptions): Promise<DatabaseMigrationResult> {
    return this.request<DatabaseMigrationResult>('device.migrateDatabase', undefined, options);
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
