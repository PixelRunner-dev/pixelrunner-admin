/**
 * Applets API
 *
 * Provides methods for managing applets (installed applications)
 * on the Pixelrunner device.
 */

import type {
  AppletConfigurationValues,
  IAppletConfigurations,
  IAppletSchema,
  IAppletSchemaObject,
  ICategory,
  UUID,
  IFullApplet,
  IFullAppletRecord
} from 'pixelrunner-shared';
import { ApiClientBase, type IRpcClient } from './client.ts';

/** Tidbyt typeahead option returned from a schema `handler` function. */
export interface ITypeaheadOption {
  display: string;
  value: AppletConfigurationValues;
}

interface AppletActionResponse<T> {
  method: string;
  data: T;
}

interface AppletQueryOptions extends Record<string, unknown> {
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
}

/**
 * AppletsAPI provides applet management functionality.
 * Works with any client that implements IRpcClient (WebSocket or Trystero).
 */
export class AppletAPI extends ApiClientBase<IRpcClient> {
  /**
   * Get list of all installed applets
   */
  async listInstalled(): Promise<IFullAppletRecord[]> {
    return this.action<IFullAppletRecord[]>('getAllAppletsByPlaylistId', { playlistId: 0 });
  }

  /**
   * Get details of a specific applet
   * When packageName is provided, returns all info about the applet by package name.
   * When uuid is provided, also includes installApplets data.
   * @param packageName - The package name
   * @param uuid - The applet UUID
   */
  async get(packageName?: string, uuid?: UUID): Promise<IFullApplet | null> {
    if (!packageName && !uuid) {
      throw new Error('Must provide either uuid or packageName');
    }

    if (uuid) {
      return this.action<IFullApplet | null>('getInstalledAppletByUUID', { uuid });
    }

    return this.action<IFullApplet | null>('getAppletByPackageName', { packageName });
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
      return this.action<{ appID: string; config: Record<string, unknown> | null }>('getConfig', {
        uuid
      });
    }
    return this.action<{ appID: string; config: Record<string, unknown> | null }>('getConfig', {
      packageName
    });
  }

  /**
   * Get the schema for an applet
   * @param packageName - The package name
   */
  async getSchema(packageName: string): Promise<IAppletSchema | string | null> {
    return this.action<IAppletSchema | string | null>('getSchema', {
      packageName
    });
  }

  /**
   * Invoke a Tidbyt schema `handler` for an applet. Used by the `generated`
   * and `typeahead` field types: the source field's current value is passed
   * to the named Starlark function and the returned list of fields/options
   * is rendered dynamically.
   *
   * @param packageName - The applet package name
   * @param handler - Starlark function name from the schema
   * @param value - Current value of the source field, forwarded as-is
   */
  async callSchemaHandler(
    packageName: string,
    handler: string,
    value: unknown
  ): Promise<IAppletSchemaObject[]> {
    const data = await this.action<IAppletSchemaObject[] | null>('callSchemaHandler', {
      packageName,
      handler,
      value
    });

    return Array.isArray(data) ? data : [];
  }

  /**
   * Invoke a typeahead `handler` for the current query string. Same
   * backend method as `callSchemaHandler`, but typed to the option-list
   * shape Tidbyt typeahead handlers return.
   *
   * @param packageName - The applet package name
   * @param handler - Starlark function name from the schema
   * @param value - Current query text from the input field
   */
  async callTypeaheadHandler(
    packageName: string,
    handler: string,
    value: string
  ): Promise<ITypeaheadOption[]> {
    const data = await this.action<ITypeaheadOption[] | null>('callSchemaHandler', {
      packageName,
      handler,
      value
    });

    if (!Array.isArray(data)) return [];

    return data.filter(
      (option): option is ITypeaheadOption =>
        Boolean(option) && typeof option === 'object' && typeof option.display === 'string'
    );
  }

  /**
   * Set the config of an applet
   * @param uuid - The applet UUID
   * @param config - The configuration object
   */
  async setConfig(uuid: UUID, config: Record<string, unknown>): Promise<void> {
    await this.saveConfig(uuid, {
      appId: '',
      config: config as IAppletConfigurations['config']
    });
  }

  async install(
    packageName: string,
    appliedConfigurations: IAppletConfigurations
  ): Promise<IFullAppletRecord | null> {
    return this.action<IFullAppletRecord | null>('installApplet', {
      packageName,
      appliedConfigurations
    });
  }

  async saveConfig(
    uuid: UUID,
    appliedConfigurations: IAppletConfigurations
  ): Promise<IFullAppletRecord | null> {
    return this.action<IFullAppletRecord | null>('saveAppletConfig', {
      uuid,
      appliedConfigurations
    });
  }

  async remove(uuid: UUID): Promise<void> {
    await this.action<unknown>('removeApplet', { uuid });
  }

  async updateHidden(uuid: UUID, isHidden: boolean): Promise<IFullAppletRecord | null> {
    return this.action<IFullAppletRecord | null>('updateAppletVisibility', {
      uuid,
      isHidden
    });
  }

  async updatePinned(uuid: UUID, isPinned: boolean): Promise<IFullAppletRecord | null> {
    return this.action<IFullAppletRecord | null>('updateAppletPinned', {
      uuid,
      isPinned
    });
  }

  async getAllApplets(options: AppletQueryOptions = {}): Promise<IFullApplet[]> {
    return this.action<IFullApplet[]>('getAllApplets', options);
  }

  async getAppletsByCategory(category: ICategory): Promise<IFullApplet[]> {
    return this.getAppletsByCategoryKey(category.key);
  }

  async getAppletsByCategoryKey(categoryKey: string): Promise<IFullApplet[]> {
    return this.action<IFullApplet[]>('getAppletsByCategoryKey', { categoryKey });
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.action<ICategory[]>('getAllCategories');
  }

  private async action<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.request<AppletActionResponse<T>>('applets.action', {
      method,
      ...(params && { params })
    });

    return response.data;
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
