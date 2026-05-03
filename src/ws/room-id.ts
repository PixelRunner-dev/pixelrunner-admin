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

import { APP_ID, ROOM_PASSWORD, ROOM_PREFIX } from '@/constants.ts';

const roomIdentity = {
  appId: APP_ID,
  password: ROOM_PASSWORD,
  roomPrefix: ROOM_PREFIX
};

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
