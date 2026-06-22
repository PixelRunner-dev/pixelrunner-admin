/**
 * Provide/inject context shared between AppletConfig and any nested
 * schema field components. Currently used by FieldGenerated so it can
 * read the source field's live value, dispatch sub-field updates to the
 * top-level configurationValues dict, and call the schema handler RPC
 * for the current applet packageName.
 */

import type { InjectionKey, Ref } from 'vue';

import type { IAppletConfigurations } from 'pixelrunner-shared';

export type AppletConfigurationValue = NonNullable<IAppletConfigurations['config'][string]>;

export interface IAppletConfigContext {
  /** The applet being configured. Used as the RPC scope for handlers. */
  packageName: string;
  /** Reactive map of every field id → current value. */
  values: Ref<Record<string, AppletConfigurationValue>>;
  /** Apply a new value for a field id (also used by generated sub-fields). */
  setValue: (id: string, value: AppletConfigurationValue) => void;
  /** Set a default for a field id only if no value is set yet. */
  ensureDefault: (id: string, value: AppletConfigurationValue | undefined) => void;
}

export const appletConfigContextKey: InjectionKey<IAppletConfigContext> =
  Symbol('appletConfigContext');
