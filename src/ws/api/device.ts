import type { WebSocketClient } from '../client.ts';
import type { DeviceStatusResponse, DeviceUpdateResponse } from '../types.ts';

export class DeviceAPI {
  constructor(private client: WebSocketClient) {}

  /**
   * Get the current device status
   */
  async status(): Promise<DeviceStatusResponse> {
    return this.client.request<DeviceStatusResponse>('device.status');
  }

  /**
   * Send text to the printer
   * @param text - The text to print
   * @param options - Print options (copies, priority)
   */
  // async print(text: string, options?: PrintOptions): Promise<PrintResponse> {
  //   return this.client.request<PrintResponse>('device.print', {
  //     text,
  //     ...options
  //   });
  // }

  /**
   * Reboot the device
   */
  async reboot(): Promise<void> {
    return this.client.request<void>('device.reboot');
  }

  /**
   * Shutdown the device
   */
  async shutdown(): Promise<void> {
    return this.client.request<void>('device.shutdown');
  }

  /**
   * Update device firmware
   */
  async updateFirmware(): Promise<DeviceUpdateResponse> {
    return this.client.request<DeviceUpdateResponse>('device.updateFirmware');
  }

  /**
   * Run factory reset
   */
  async factoryReset(): Promise<void> {
    return this.client.request<void>('device.factoryReset');
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
