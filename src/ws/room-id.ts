import {
  DEFAULT_PUBLIC_IP_ENDPOINT,
  DEFAULT_PUBLIC_IP_TIMEOUT_MS,
  createTrysteroRoomIdFromPublicIp,
  fetchPublicIp as fetchSharedPublicIp,
  isPublicIp,
  normalizeIp,
  resolveTrysteroRoomId as resolveSharedTrysteroRoomId,
  type ResolveTrysteroRoomIdOptions
} from 'pixelrunner-shared';

import { APP_ID, ROOM_PASSWORD as DEFAULT_ROOM_PASSWORD, ROOM_PREFIX } from '@/constants.ts';
import { CookieStore } from '@/utils/CookieStore.ts';

const PROXY_CONFIG_PATH = '/.pixelrunner/proxy-config';

export interface ProxyRoomConfig {
  appId?: string;
  deviceId?: string;
  roomId?: string;
  roomPassword?: string;
  fallbackRoomId?: string;
  controllerWebSocketPath?: string;
  iceServers?: RTCIceServer[];
}

function createRoomIdentity(password = DEFAULT_ROOM_PASSWORD) {
  return {
    appId: APP_ID,
    password,
    roomPrefix: ROOM_PREFIX
  };
}

function withBrowserDefaults(
  options: ResolveTrysteroRoomIdOptions = {}
): ResolveTrysteroRoomIdOptions {
  return {
    ...options,
    endpoint:
      options.endpoint ?? import.meta.env.VITE_PUBLIC_IP_ENDPOINT ?? DEFAULT_PUBLIC_IP_ENDPOINT,
    timeoutMs: options.timeoutMs ?? DEFAULT_PUBLIC_IP_TIMEOUT_MS
  };
}

export { isPublicIp, normalizeIp };

function getUrlParam(name: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
}

function normalizeFallbackRoomId(roomId: string | null): string | null {
  const value = roomId?.trim();
  return value ? value : null;
}

function createFallbackRoomIdFromDeviceId(deviceId: string | null): string | null {
  const value = deviceId?.trim();
  return value ? `${ROOM_PREFIX}-${value}` : null;
}

export function getFallbackRoomId(): string | undefined {
  return (
    normalizeFallbackRoomId(getUrlParam('fallbackRoomId')) ??
    createFallbackRoomIdFromDeviceId(getUrlParam('deviceId')) ??
    normalizeFallbackRoomId(import.meta.env.VITE_FALLBACK_ROOM_ID) ??
    createFallbackRoomIdFromDeviceId(CookieStore.get('deviceId')) ??
    createFallbackRoomIdFromDeviceId(import.meta.env.VITE_DEVICE_ID) ??
    undefined
  );
}

function readStringProperty(value: unknown, key: keyof ProxyRoomConfig): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === 'string' && property.trim() ? property : undefined;
}

function readIceServer(value: unknown): RTCIceServer | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const server = value as Record<string, unknown>;
  const rawUrls = typeof server.urls === 'string' ? [server.urls] : server.urls;
  if (!Array.isArray(rawUrls)) {
    return null;
  }

  const urls = rawUrls
    .filter((url): url is string => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => /^(?:stun|stuns|turn|turns):/i.test(url));
  if (urls.length === 0 || urls.length !== rawUrls.length) {
    return null;
  }

  const username = typeof server.username === 'string' ? server.username.trim() : '';
  const credential = typeof server.credential === 'string' ? server.credential.trim() : '';
  const requiresCredentials = urls.some((url) => /^turns?:/i.test(url));
  if (requiresCredentials && (!username || !credential)) {
    return null;
  }

  return {
    urls: typeof server.urls === 'string' ? urls[0] : urls,
    ...(username ? { username } : {}),
    ...(credential ? { credential } : {})
  };
}

function readIceServersProperty(value: unknown): RTCIceServer[] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const property = (value as Record<string, unknown>).iceServers;
  if (!Array.isArray(property)) {
    return undefined;
  }

  const iceServers = property
    .map((server) => readIceServer(server))
    .filter((server): server is RTCIceServer => server !== null);
  return iceServers.length > 0 ? iceServers : undefined;
}

export async function fetchProxyRoomConfig(): Promise<ProxyRoomConfig | null> {
  try {
    const response = await fetch(PROXY_CONFIG_PATH, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as unknown;
    return {
      appId: readStringProperty(body, 'appId'),
      deviceId: readStringProperty(body, 'deviceId'),
      roomId: readStringProperty(body, 'roomId'),
      roomPassword: readStringProperty(body, 'roomPassword'),
      fallbackRoomId: readStringProperty(body, 'fallbackRoomId'),
      controllerWebSocketPath: readStringProperty(body, 'controllerWebSocketPath'),
      iceServers: readIceServersProperty(body)
    };
  } catch (error) {
    console.warn('[trystero-client] Failed to read proxy room config:', error);
    return null;
  }
}

export async function createRoomIdFromPublicIp(publicIp: string): Promise<string> {
  const identity = createRoomIdentity();
  if (!identity.password) {
    throw new Error('Room password required to derive room ID from public IP');
  }
  return createTrysteroRoomIdFromPublicIp(
    publicIp,
    identity as Parameters<typeof createTrysteroRoomIdFromPublicIp>[1]
  );
}

export async function fetchPublicIp(options: ResolveTrysteroRoomIdOptions = {}): Promise<string> {
  return fetchSharedPublicIp(withBrowserDefaults(options));
}

export async function resolveTrysteroRoomId(
  configuredRoomId?: string,
  options: ResolveTrysteroRoomIdOptions = {}
): Promise<string> {
  return resolveSharedTrysteroRoomId(configuredRoomId, {
    ...withBrowserDefaults(options),
    ...createRoomIdentity(options.password),
    onLookupError: (error) => {
      console.warn('[trystero-client] Failed to derive room ID from public IP:', error);
      options.onLookupError?.(error);
    }
  });
}
