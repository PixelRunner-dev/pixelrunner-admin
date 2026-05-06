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

import { APP_ID, DEFAULT_DEVICE_ID, ROOM_PASSWORD, ROOM_PREFIX } from '@/constants.ts';
import { CookieStore } from '@/utils/CookieStore.ts';

const roomIdentity = {
  appId: APP_ID,
  password: ROOM_PASSWORD,
  roomPrefix: ROOM_PREFIX
};
const PROXY_CONFIG_PATH = '/.pixelrunner/proxy-config';

export interface ProxyRoomConfig {
  appId?: string;
  deviceId?: string;
  roomId?: string;
  fallbackRoomId?: string;
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

export function getFallbackRoomId(): string {
  return (
    normalizeFallbackRoomId(getUrlParam('fallbackRoomId')) ??
    createFallbackRoomIdFromDeviceId(getUrlParam('deviceId')) ??
    normalizeFallbackRoomId(import.meta.env.VITE_FALLBACK_ROOM_ID) ??
    createFallbackRoomIdFromDeviceId(CookieStore.get('deviceId')) ??
    createFallbackRoomIdFromDeviceId(import.meta.env.VITE_DEVICE_ID) ??
    `${ROOM_PREFIX}-${DEFAULT_DEVICE_ID}`
  );
}

function readStringProperty(value: unknown, key: keyof ProxyRoomConfig): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === 'string' && property.trim() ? property : undefined;
}

export async function fetchProxyRoomConfig(): Promise<ProxyRoomConfig | null> {
  try {
    const response = await fetch(PROXY_CONFIG_PATH, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const body = await response.json() as unknown;
    return {
      appId: readStringProperty(body, 'appId'),
      deviceId: readStringProperty(body, 'deviceId'),
      roomId: readStringProperty(body, 'roomId'),
      fallbackRoomId: readStringProperty(body, 'fallbackRoomId')
    };
  } catch (error) {
    console.warn('[trystero-client] Failed to read proxy room config:', error);
    return null;
  }
}

export async function createRoomIdFromPublicIp(publicIp: string): Promise<string> {
  return createTrysteroRoomIdFromPublicIp(publicIp, roomIdentity);
}

export async function fetchPublicIp(
  options: ResolveTrysteroRoomIdOptions = {}
): Promise<string> {
  return fetchSharedPublicIp(withBrowserDefaults(options));
}

export async function resolveTrysteroRoomId(
  configuredRoomId?: string,
  options: ResolveTrysteroRoomIdOptions = {}
): Promise<string> {
  return resolveSharedTrysteroRoomId(configuredRoomId, {
    ...withBrowserDefaults(options),
    ...roomIdentity,
    onLookupError: (error) => {
      console.warn('[trystero-client] Failed to derive room ID from public IP:', error);
      options.onLookupError?.(error);
    }
  });
}
