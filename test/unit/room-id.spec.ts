import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { APP_ID, ROOM_PASSWORD, ROOM_PREFIX } from '@/constants.ts';
import {
  createRoomIdFromPublicIp,
  fetchPublicIp,
  fetchProxyRoomConfig,
  getFallbackRoomId,
  isPublicIp,
  resolveTrysteroRoomId
} from '@/ws/room-id.ts';
import { CookieStore } from '@/utils/CookieStore.ts';

function expectedRoomId(publicIp: string) {
  const roomHash = createHash('sha256')
    .update(`${APP_ID}:${ROOM_PASSWORD}:${publicIp}`)
    .digest('hex');

  return `${ROOM_PREFIX}-${roomHash.slice(0, 32)}`;
}

describe('trystero room id', () => {
  it('uses the proxy-compatible default fallback room id', () => {
    CookieStore.delete('deviceId');

    expect(getFallbackRoomId()).toBe('pixelrunner-pxlr_f91a');
  });

  it('uses the stored device id for the fallback room id when available', () => {
    CookieStore.set('deviceId', 'pxlr_custom');

    expect(getFallbackRoomId()).toBe('pixelrunner-pxlr_custom');

    CookieStore.delete('deviceId');
  });

  it('creates a deterministic room id from a public IP hash', async () => {
    await expect(createRoomIdFromPublicIp('8.8.8.8')).resolves.toBe(expectedRoomId('8.8.8.8'));
  });

  it('rejects internal or invalid IP addresses', () => {
    expect(isPublicIp('192.168.1.10')).toBe(false);
    expect(isPublicIp('10.0.0.12')).toBe(false);
    expect(isPublicIp('172.16.0.5')).toBe(false);
    expect(isPublicIp('127.0.0.1')).toBe(false);
    expect(isPublicIp('fe80::1')).toBe(false);
    expect(isPublicIp('8.8.8.8')).toBe(true);
    expect(isPublicIp('2001:4860:4860::8888')).toBe(true);
  });

  it('reads public IP from JSON endpoint responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ip: '8.8.8.8' }), {
        status: 200
      })
    );

    await expect(fetchPublicIp({ fetcher, endpoint: '/ip' })).resolves.toBe('8.8.8.8');
    expect(fetcher).toHaveBeenCalledWith(
      '/ip',
      expect.objectContaining({
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('reads the resolved room id from the device proxy config endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          appId: 'pixelrunner',
          deviceId: 'pxlr_f91a',
          roomId: 'pixelrunner-pxlr_f91a',
          fallbackRoomId: 'pixelrunner-pxlr_f91a',
          controllerWebSocketPath: '/.pixelrunner/controller',
          iceServers: [
            { urls: 'stun:stun.example.com:3478' },
            {
              urls: ['turn:turn.example.com:3478', 'turns:turn.example.com:5349'],
              username: 'runtime-user',
              credential: 'runtime-secret'
            },
            { urls: 'https://invalid.example.com' },
            { urls: 'turn:missing-credentials.example.com' }
          ]
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetcher);

    await expect(fetchProxyRoomConfig()).resolves.toEqual({
      appId: 'pixelrunner',
      deviceId: 'pxlr_f91a',
      roomId: 'pixelrunner-pxlr_f91a',
      fallbackRoomId: 'pixelrunner-pxlr_f91a',
      controllerWebSocketPath: '/.pixelrunner/controller',
      iceServers: [
        { urls: 'stun:stun.example.com:3478' },
        {
          urls: ['turn:turn.example.com:3478', 'turns:turn.example.com:5349'],
          username: 'runtime-user',
          credential: 'runtime-secret'
        }
      ]
    });
    expect(fetcher).toHaveBeenCalledWith('/.pixelrunner/proxy-config', { cache: 'no-store' });

    vi.unstubAllGlobals();
  });

  it('keeps configured room id and skips public IP lookup', async () => {
    const fetcher = vi.fn();

    await expect(resolveTrysteroRoomId('pixelrunner-explicit', { fetcher })).resolves.toBe(
      'pixelrunner-explicit'
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('falls back when public IP lookup fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(
      resolveTrysteroRoomId(undefined, {
        fetcher,
        fallbackRoomId: 'pixelrunner-fallback'
      })
    ).resolves.toBe('pixelrunner-fallback');
    expect(warn).toHaveBeenCalledWith(
      '[trystero-client] Failed to derive room ID from public IP:',
      expect.any(Error)
    );
    warn.mockRestore();
  });
});
