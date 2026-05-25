/// <reference types="vite/client" />

import 'vue';

declare global {
  const __ADMIN_BUILD_ID__: string;

  interface Window {
    ask?: (message: string) => boolean | Promise<boolean>;
  }

  interface ImportMetaEnv {
    readonly VITE_MOCK_CONTROLLER?: string;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, options?: Record<string, unknown>) => string;
  }
}
