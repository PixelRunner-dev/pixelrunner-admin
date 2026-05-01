import { onBeforeUnmount, onMounted, ref } from 'vue';

const DEFAULT_VERSION_CHECK_INTERVAL_MS = 90_000;

interface AdminVersionManifest {
  app?: string;
  version?: string;
  adminBuildId?: string;
}

interface AdminVersionCheckOptions {
  intervalMs?: number;
}

function getVersionManifestUrl() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.replace(/\/$/, '')}/version.json`;
}

export function useAdminVersionCheck(options: AdminVersionCheckOptions = {}) {
  const hasUpdateAvailable = ref(false);
  const latestVersion = ref<AdminVersionManifest | null>(null);
  const currentBuildId = __ADMIN_BUILD_ID__;
  let interval: ReturnType<typeof setInterval> | null = null;

  async function checkForUpdate() {
    if (import.meta.env.DEV) {
      return;
    }

    try {
      const response = await fetch(`${getVersionManifestUrl()}?t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        return;
      }

      const manifest = (await response.json()) as AdminVersionManifest;
      latestVersion.value = manifest;

      if (manifest.adminBuildId && manifest.adminBuildId !== currentBuildId) {
        hasUpdateAvailable.value = true;
      }
    } catch {
      // Offline or stale deploy window. Keep current UI quiet.
    }
  }

  function refreshPage() {
    window.location.reload();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void checkForUpdate();
    }
  }

  onMounted(() => {
    void checkForUpdate();
    interval = setInterval(
      () => void checkForUpdate(),
      options.intervalMs ?? DEFAULT_VERSION_CHECK_INTERVAL_MS
    );
    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    if (interval) {
      clearInterval(interval);
    }
    window.removeEventListener('focus', checkForUpdate);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    currentBuildId,
    hasUpdateAvailable,
    latestVersion,
    checkForUpdate,
    refreshPage
  };
}
