import { describe, it, expect, vi } from 'vitest';
import { ref, computed } from 'vue';
import { isRpcClient, ApiClientBase } from '@/ws/api/client';
import type { IRpcClient } from '@/ws/api/client';

function makeValidClient(): IRpcClient {
  return {
    state: ref('disconnected' as const),
    isConnected: computed(() => false),
    isConnecting: computed(() => false),
    lastError: ref(null),
    request: vi.fn().mockResolvedValue({ result: null }),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    reconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnValue(vi.fn()),
    off: vi.fn(),
    once: vi.fn()
  };
}

describe('src/ws/api/client.ts', () => {
  describe('isRpcClient type guard', () => {
    it('returns false for null', () => {
      expect(isRpcClient(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isRpcClient(undefined)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isRpcClient(42)).toBe(false);
      expect(isRpcClient('string')).toBe(false);
      expect(isRpcClient(true)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isRpcClient({})).toBe(false);
    });

    it('returns false for object missing request', () => {
      const obj = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        state: ref('disconnected' as const),
        isConnected: computed(() => false)
      };
      expect(isRpcClient(obj)).toBe(false);
    });

    it('returns false for object missing connect', () => {
      const obj = {
        request: vi.fn(),
        disconnect: vi.fn(),
        state: ref('disconnected' as const),
        isConnected: computed(() => false)
      };
      expect(isRpcClient(obj)).toBe(false);
    });

    it('returns false for object missing disconnect', () => {
      const obj = {
        request: vi.fn(),
        connect: vi.fn(),
        state: ref('disconnected' as const),
        isConnected: computed(() => false)
      };
      expect(isRpcClient(obj)).toBe(false);
    });

    it('returns false for object missing state', () => {
      const obj = {
        request: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: computed(() => false)
      };
      expect(isRpcClient(obj)).toBe(false);
    });

    it('returns false for object missing isConnected', () => {
      const obj = {
        request: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        state: ref('disconnected' as const)
      };
      expect(isRpcClient(obj)).toBe(false);
    });

    it('returns true for valid client object', () => {
      const client = makeValidClient();
      expect(isRpcClient(client)).toBe(true);
    });

    it('returns true for object with all required properties', () => {
      const obj = {
        request: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        state: ref('disconnected' as const),
        isConnected: computed(() => false),
        isConnecting: computed(() => false),
        lastError: ref(null)
      };
      expect(isRpcClient(obj)).toBe(true);
    });
  });

  describe('ApiClientBase', () => {
    it('stores client and is accessible via subclass', () => {
      const client = makeValidClient();
      const api = new (class TestApi extends ApiClientBase<IRpcClient> {
        getClient() {
          return this.client;
        }
      })(client);
      expect(api.getClient()).toBe(client);
    });

    it('delegates request to underlying client', async () => {
      const client = makeValidClient();
      const api = new (class TestApi extends ApiClientBase<IRpcClient> {
        doRequest() {
          return this.request('test.method', { key: 'val' });
        }
      })(client);

      await api.doRequest();
      expect(client.request).toHaveBeenCalledWith('test.method', { key: 'val' }, undefined);
    });

    it('delegates request with options', async () => {
      const client = makeValidClient();
      const api = new (class TestApi extends ApiClientBase<IRpcClient> {
        doRequest() {
          return this.request('m', {}, { timeout: 5000 });
        }
      })(client);

      await api.doRequest();
      expect(client.request).toHaveBeenCalledWith('m', {}, { timeout: 5000 });
    });

    it('provides on method that returns unsubscribe function', () => {
      const unsubFn = vi.fn();
      const client = makeValidClient();
      (client.on as ReturnType<typeof vi.fn>).mockReturnValue(unsubFn);

      const api = new (class TestApi extends ApiClientBase<IRpcClient> {
        subscribe() {
          return this.on('message:test', vi.fn());
        }
      })(client);

      const unsub = api.subscribe();
      expect(unsub).toBe(unsubFn);
    });

    it('connected getter reflects isConnected state', () => {
      const isConnectedRef = ref(false);
      const client: IRpcClient = {
        ...makeValidClient(),
        isConnected: computed(() => isConnectedRef.value)
      };

      const api = new (class TestApi extends ApiClientBase<IRpcClient> {
        get isConn() {
          return this.connected;
        }
      })(client);

      expect(api.isConn).toBe(false);
      isConnectedRef.value = true;
      expect(api.isConn).toBe(true);
    });
  });
});
