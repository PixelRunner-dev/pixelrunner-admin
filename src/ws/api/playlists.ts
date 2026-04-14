/**
 * Playlists API
 *
 * Provides methods for managing playlists on the Pixelrunner device.
 */

import type { IPlaylist } from 'pixelrunner-shared';
import { ApiClientBase, type IRpcClient } from './client.ts';

/**
 * PlaylistsAPI provides playlist management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
 */
export class PlaylistsAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get the currently active playlist
   */
  async activePlaylist(): Promise<IPlaylist> {
    return this.request<IPlaylist>('playlists.activePlaylist');
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
