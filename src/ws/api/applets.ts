import type { UUID } from 'pixelrunner-shared/lib/types.d.ts';

import type { IFullAppletRecord } from 'pixelrunner-shared/lib/interfaces';
import type { WebSocketClient } from '../client';
import type { AppletListResponse, AppletResponse, InstallResponse } from '../types';

// /**
//  * Run applet action by providing the method name and optional parameters
//  * @param {string} method - The method to run
//  * @param {Record<string, unknown>} [params] - Optional parameters
//  */
// async appletAction(method: string, params: Record<string, unknown>): Promise<UpdateResponse> {
//   return this.client.request<UpdateResponse>('applet.action', {
//     method,
//     params
//   });
// }

export class AppletAPI {
  constructor(private client: WebSocketClient) {}

  /**
   * Get list of all applets
   */
  async list(): Promise<IFullAppletRecord[]> {
    return this.client.request<IFullAppletRecord[]>('applets.list');
  }

  /**
   * Get details of a specific applet
   * When packageName is provided, the return is all info about the applet by package name,
   * when uuid is provided, the return also includes installApplets data.
   * @param {string} [packageName] - The package name
   * @param {UUID} [uuid] - The applet UUID
   */
  async get(packageName?: string, uuid?: UUID): Promise<IFullAppletRecord> {
    if (!packageName && !uuid) throw new Error('Must provide either uuid or packageName');

    if (packageName && uuid) {
      return this.client.request<IFullAppletRecord>('applets.action', {
        method: 'getInstalledAppletByUUID',
        params: { uuid }
      });
    }

    return this.client.request<IFullAppletRecord>('applets.action', {
      method: 'getAppletByPackageName',
      params: { packageName }
    });
  }

  /**
   * Install an applet
   * @param packageName - The package name to install
   */
  async install(packageName: string): Promise<InstallResponse> {
    return this.client.request<InstallResponse>('applets.install', {
      packageName
    });
  }

  /**
   * Uninstall an applet
   * @param {UUID} uuid - The applet UUID to uninstall
   */
  async uninstall(uuid: UUID): Promise<void> {
    return this.client.request<void>('applets.uninstall', { uuid });
  }

  /**
   * Get the config of an (installed) applet
   * When packageName is provided, the return is a template,
   * when uuid is provided, the return is the actual config of that instance.
   * @param {string} [packageName] - The package name
   * @param {UUID} [uuid] - The applet UUID
   */
  async getConfig(
    packageName?: string,
    uuid?: UUID
  ): Promise<{ appID: string; config: Record<string, unknown> | null }> {
    if (!packageName && !uuid) throw new Error('Must provide either uuid or packageName');

    if (uuid) {
      return this.client.request<{ appID: string; config: Record<string, unknown> | null }>(
        'applets.action',
        {
          method: 'getConfig',
          params: { uuid }
        }
      );
    }
    return this.client.request<{ appID: string; config: Record<string, unknown> | null }>(
      'applets.action',
      {
        method: 'getConfig',
        params: { packageName }
      }
    );
  }

  async getSchema(
    packageName: string
  ): Promise<{ version: string; schema: Record<string, unknown>[] }> {
    return this.client.request<{ version: string; schema: Record<string, unknown>[] }>(
      'applets.action',
      {
        method: 'getSchema',
        params: { packageName }
      }
    );
  }

  /**
   * Set the config of an applet
   * @param {UUID} uuid - The applet UUID
   * @param config - The configuration object
   */
  async setConfig(uuid: UUID, config: Record<string, unknown>): Promise<void> {
    return this.client.request<void>('applets.setconfig', { uuid, config });
  }

  /**
   * Subscribe to applet installed events
   * @param handler - Callback function when an applet is installed
   * @returns Unsubscribe function
   */
  onInstalled(handler: (applet: AppletResponse) => void): () => void {
    return this.client.on('message:applets.installed', handler);
  }

  /**
   * Subscribe to applet uninstalled events
   * @param handler - Callback function when an applet is uninstalled
   * @returns Unsubscribe function
   */
  onUninstalled(handler: (data: { uuid: UUID }) => void): () => void {
    return this.client.on('message:applets.uninstalled', handler);
  }
}
