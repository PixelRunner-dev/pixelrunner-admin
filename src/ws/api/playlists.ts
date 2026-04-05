import type { WebSocketClient } from '../client.ts';
import type { DeviceStatusResponse, PlaylistResponse } from '../types.ts';

export class PlaylistsAPI {
  constructor(private client: WebSocketClient) {}

  async store(): Promise<DeviceStatusResponse> {
    return this.client.request<DeviceStatusResponse>('playlists.store');
  }

  async activePlaylist(): Promise<PlaylistResponse> {
    return this.client.request<PlaylistResponse>('playlists.activePlaylist');
  }

  /**
   * Subscribe to device status change events
   * @param handler - Callback function when device status changes
   * @returns Unsubscribe function
   */
  onStatusChange(handler: (status: DeviceStatusResponse) => void): () => void {
    return this.client.on('message:device.status_changed', handler);
  }

  // order change
}
