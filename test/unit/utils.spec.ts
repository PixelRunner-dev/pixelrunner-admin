import { afterEach, describe, expect, it, vi } from 'vitest';

import { CookieStore } from '@/utils/CookieStore.ts';
import { controllerConnectionLost } from '@/utils/controllerConnectionState.ts';
import {
  detectAccessMode,
  getWebSocketUrl,
  markAsViaProxy,
  requiresProxyConnection
} from '@/utils/access-detector.ts';

const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

const clearCookies = () => {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
};

const sessionStorageMock = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    })
  } as Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>;
};

const stubBrowserLocation = (hostname: string, storage = sessionStorageMock()) => {
  vi.stubGlobal('window', {
    location: { hostname }
  });
  vi.stubGlobal('sessionStorage', storage);

  return storage;
};

afterEach(() => {
  if (originalCookieDescriptor) {
    Object.defineProperty(document, 'cookie', originalCookieDescriptor);
  }

  clearCookies();
  controllerConnectionLost.value = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CookieStore', () => {
  it('sets, reads, and detects encoded cookie values', () => {
    CookieStore.set('theme name', 'pixel runner');

    expect(CookieStore.get('theme name')).toBe('pixel runner');
    expect(CookieStore.has('theme name')).toBe(true);
    expect(document.cookie).toContain('theme%20name=pixel%20runner');
  });

  it('supports session cookies when days is zero', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    CookieStore.set('session', 'active', 0);

    expect(CookieStore.get('session')).toBe('active');
    expect(document.cookie).toBe('session=active');
  });

  it('returns null for missing cookies and false for missing keys', () => {
    expect(CookieStore.get('missing')).toBeNull();
    expect(CookieStore.has('missing')).toBe(false);
  });

  it('deletes cookies by name', () => {
    CookieStore.set('language', 'nl');
    CookieStore.delete('language');

    expect(CookieStore.get('language')).toBeNull();
    expect(CookieStore.has('language')).toBe(false);
  });

  it('returns all decoded cookies and skips malformed pairs', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'theme=pixelrunner; encoded%20name=encoded%20value; invalid-pair',
      set: vi.fn()
    });

    expect(CookieStore.all()).toEqual({
      theme: 'pixelrunner',
      'encoded name': 'encoded value'
    });
  });

  it('returns an empty object when no cookies exist', () => {
    expect(CookieStore.all()).toEqual({});
  });
});

describe('controllerConnectionState', () => {
  it('exposes a shared mutable connection-lost ref', () => {
    expect(controllerConnectionLost.value).toBe(false);

    controllerConnectionLost.value = true;

    expect(controllerConnectionLost.value).toBe(true);
  });
});

describe('access-detector', () => {
  it('prefers a stored local access mode over hostname detection', () => {
    stubBrowserLocation('admin.pixelrunner.dev');
    CookieStore.set('accessMode', 'local');

    expect(detectAccessMode()).toBe('local');
    expect(requiresProxyConnection()).toBe(true);
  });

  it('prefers a stored direct access mode over hostname detection', () => {
    stubBrowserLocation('192.168.1.10');
    CookieStore.set('accessMode', 'direct');

    expect(detectAccessMode()).toBe('direct');
    expect(requiresProxyConnection()).toBe(false);
  });

  it.each([
    'localhost',
    '127.0.0.1',
    '192.168.1.10',
    '10.0.0.5',
    '172.16.0.2',
    'pixelrunner.local'
  ])('detects %s as local access', (hostname) => {
    stubBrowserLocation(hostname);

    expect(detectAccessMode()).toBe('local');
    expect(CookieStore.get('accessMode')).toBe('local');
  });

  it('detects static hosting as direct access when it is not proxied', () => {
    const storage = stubBrowserLocation('pixelrunner.github.io');

    expect(detectAccessMode()).toBe('direct');
    expect(CookieStore.get('accessMode')).toBe('direct');
    expect(storage.getItem).toHaveBeenCalledWith('viaProxy');
  });

  it('detects static hosting as local access when proxy state is present', () => {
    const storage = sessionStorageMock();
    storage.setItem('viaProxy', 'true');
    stubBrowserLocation('admin.netlify.app', storage);

    expect(detectAccessMode()).toBe('local');
    expect(CookieStore.get('accessMode')).toBe('local');
  });

  it('returns unknown for custom domains without stored access mode', () => {
    stubBrowserLocation('admin.pixelrunner.dev');

    expect(detectAccessMode()).toBe('unknown');
    expect(requiresProxyConnection()).toBe(true);
  });

  it('builds proxy and direct WebSocket URLs from access mode', () => {
    stubBrowserLocation('pixelrunner.local');
    expect(getWebSocketUrl()).toBe('ws://pixelrunner.local:8765');

    clearCookies();
    stubBrowserLocation('pixelrunner.github.io');
    expect(getWebSocketUrl()).toBe('ws://localhost:8765');
  });

  it('marks the current session as proxied local access', () => {
    const storage = stubBrowserLocation('pixelrunner.github.io');

    markAsViaProxy();

    expect(storage.setItem).toHaveBeenCalledWith('viaProxy', 'true');
    expect(CookieStore.get('accessMode')).toBe('local');
  });
});
