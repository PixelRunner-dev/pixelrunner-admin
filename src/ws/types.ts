import type { ErrorResponse, SuccessResponse } from 'pixelrunner-shared';

// ============================================================================
// API - Device
// ============================================================================

export interface DeviceStatusResult {
  result: {
    status: 'idle' | 'busy' | 'error';
    uptime: [number, number];
    updateAvailable: boolean;
    // temperature?: number;
    cpus?: unknown[];
    memory?: [number, number, number];
    versions?: {
      admin: string;
      applets: string;
      controller: string;
      shared: string;
      os: string;
    };
  };
}
export type DeviceStatusResponse = SuccessResponse<DeviceStatusResult> | ErrorResponse;

type DeviceUpdateStatus =
  | 'idle'
  | 'skipping'
  | 'downloading'
  | 'installing'
  | 'restarting'
  | 'error'
  | 'done';
export interface DeviceUpdateResult {
  result?: {
    admin: DeviceUpdateStatus;
    applets: DeviceUpdateStatus;
    controller: DeviceUpdateStatus;
    shared: DeviceUpdateStatus;
    os: DeviceUpdateStatus;
  };
}
export type DeviceUpdateResponse = SuccessResponse<DeviceUpdateResult> | ErrorResponse;
