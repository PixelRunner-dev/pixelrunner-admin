import type { IRpcClient } from '@/ws/api/client.ts';

export interface SetupStatus {
  databaseExists: boolean;
  wifiConfigured: boolean;
  setupRequired: boolean;
}

interface SetupRouteLike {
  name: unknown;
  query: Record<string, unknown>;
}

const REQUEST_TIMEOUT_MS = 5_000;
const SETUP_STATUS_METHOD = 'device.setupStatus';

let setupStatusClient: IRpcClient | null = null;

export function configureSetupStatusClient(client: IRpcClient): void {
  setupStatusClient = client;
}

function waitForSetupStatusClientConnection(client: IRpcClient): Promise<void> {
  if (client.isConnected.value) return Promise.resolve();
  if (!client.isConnecting.value) return client.connect();

  return new Promise((resolve, reject) => {
    const unsubscribeConnected = client.on('connected', () => {
      cleanup();
      resolve();
    });
    const unsubscribeError = client.on('error', (event) => {
      cleanup();
      reject(event.error);
    });
    const cleanup = () => {
      unsubscribeConnected();
      unsubscribeError();
    };
  });
}

export async function getSetupStatus(): Promise<SetupStatus> {
  if (!setupStatusClient) {
    throw new Error('Setup status client has not been configured');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    await waitForSetupStatusClientConnection(setupStatusClient);

    return await setupStatusClient.request<SetupStatus>(SETUP_STATUS_METHOD, undefined, {
      signal: controller.signal,
      timeout: REQUEST_TIMEOUT_MS
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function isSetupRequired(): Promise<boolean> {
  return (await getSetupStatus()).setupRequired;
}

export async function getSetupRedirect(to: SetupRouteLike) {
  const status = await getSetupStatus();
  const isSetupPage = to.name === 'setup';
  const isFirstTimeSettings = to.name === 'settings' && to.query['first-time'] === '1';

  if (!status.databaseExists && !isSetupPage) {
    return { name: 'setup' };
  }

  if (status.databaseExists && !status.wifiConfigured && !isFirstTimeSettings) {
    return { name: 'settings', query: { 'first-time': '1' } };
  }

  if (isSetupPage && status.databaseExists && status.wifiConfigured) {
    return { name: 'applet-list' };
  }

  return null;
}
