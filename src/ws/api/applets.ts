/**
 * Applets API
 *
 * Provides methods for managing applets (installed applications)
 * on the Pixelrunner device.
 */

import type { UUID } from 'pixelrunner-shared;
import type { IFullAppletRecord } from 'pixelrunner-shared;
import { ApiClientBase, type IRpcClient } from './client.ts';

/**
 * AppletsAPI provides applet management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
 */
export class AppletAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get list of all installed applets
   */
  async listInstalled(): Promise<IFullAppletRecord[]> {
    return this.request<IFullAppletRecord[]>('applets.action', {
      method: 'getAllAppletsByPlaylistId',
      params: { playlistId: 0 }
    });
  }

  /**
   * Get details of a specific applet
   * When packageName is provided, returns all info about the applet by package name.
   * When uuid is provided, also includes installApplets data.
   * @param packageName - The package name
   * @param uuid - The applet UUID
   */
  async get(packageName?: string, uuid?: UUID): Promise<IFullAppletRecord> {
    if (!packageName && !uuid) {
      throw new Error('Must provide either uuid or packageName');
    }

    if (packageName && uuid) {
      return this.request<IFullAppletRecord>('applets.action', {
        method: 'getInstalledAppletByUUID',
        params: { uuid }
      });
    }

    return this.request<IFullAppletRecord>('applets.action', {
      method: 'getAppletByPackageName',
      params: { packageName }
    });
  }

  /**
   * Get the config of an (installed) applet
   * When packageName is provided, returns a template.
   * When uuid is provided, returns the actual config of that instance.
   * @param packageName - The package name
   * @param uuid - The applet UUID
   */
  async getConfig(
    packageName?: string,
    uuid?: UUID
  ): Promise<{ appID: string; config: Record<string, unknown> | null }> {
    if (!packageName && !uuid) {
      throw new Error('Must provide either uuid or packageName');
    }

    if (uuid) {
      return this.request<{ appID: string; config: Record<string, unknown> | null }>(
        'applets.action',
        {
          method: 'getConfig',
          params: { uuid }
        }
      );
    }
    return this.request<{ appID: string; config: Record<string, unknown> | null }>(
      'applets.action',
      {
        method: 'getConfig',
        params: { packageName }
      }
    );
  }

  /**
   * Get the schema for an applet
   * @param packageName - The package name
   */
  async getSchema(
    packageName: string
  ): Promise<{ version: string; schema: Record<string, unknown>[] }> {
    return this.request<{ version: string; schema: Record<string, unknown>[] }>('applets.action', {
      method: 'getSchema',
      params: { packageName }
    });
  }

  /**
   * Set the config of an applet
   * @param uuid - The applet UUID
   * @param config - The configuration object
   */
  async setConfig(uuid: UUID, config: Record<string, unknown>): Promise<void> {
    return this.request<void>('applets.setconfig', { uuid, config });
  }

  // /**
  //  * Install an applet
  //  * @param packageName - The package name to install
  //  */
  // async install(packageName: string): Promise<InstallResponse> {
  //   return this.client.request<InstallResponse>('applets.install', {
  //     packageName
  //   });
  // }

  // /**
  //  * Uninstall an applet
  //  * @param {UUID} uuid - The applet UUID to uninstall
  //  */
  // async uninstall(uuid: UUID): Promise<void> {
  //   return this.client.request<void>('applets.uninstall', { uuid });
  // }

  // /**
  //  * Subscribe to applet installed events
  //  * @param handler - Callback function when an applet is installed
  //  * @returns Unsubscribe function
  //  */
  // onInstalled(handler: (applet: AppletResponse) => void): () => void {
  //   return this.client.on('message:applets.installed', handler);
  // }

  // /**
  //  * Subscribe to applet uninstalled events
  //  * @param handler - Callback function when an applet is uninstalled
  //  * @returns Unsubscribe function
  //  */
  // onUninstalled(handler: (data: { uuid: UUID }) => void): () => void {
  //   return this.client.on('message:applets.uninstalled', handler);
  // }
}
