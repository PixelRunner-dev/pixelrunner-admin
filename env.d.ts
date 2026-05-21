/// <reference types="vite/client" />

declare const __ADMIN_BUILD_ID__: string;

interface Window {
  ask?: (message: string) => boolean | Promise<boolean>;
}

interface ImportMetaEnv {
  readonly VITE_MOCK_CONTROLLER?: string;
}
