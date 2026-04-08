import type { IPlaylist } from 'pixelrunner-shared/lib/interfaces/IPlaylist';
import type { WebSocketClient } from '../client.ts';
// import type { DeviceStatusResponse } from '../types.ts';

export class PlaylistsAPI {
  constructor(private client: WebSocketClient) {}

  // async store(): Promise<DeviceStatusResponse> {
  //   return this.client.request<DeviceStatusResponse>('playlists.store');
  // }

  async activePlaylist(): Promise<IPlaylist> {
    return this.client.request<IPlaylist>('playlists.activePlaylist');
  }

  // /**
  //  * Subscribe to device status change events
  //  * @param handler - Callback function when device status changes
  //  * @returns Unsubscribe function
  //  */
  // onStatusChange(handler: (status: DeviceStatusResponse) => void): () => void {
  //   return this.client.on('message:device.status_changed', handler);
  // }

  // order change
}
