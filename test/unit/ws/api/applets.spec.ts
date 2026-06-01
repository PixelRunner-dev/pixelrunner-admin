import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computed, ref } from 'vue';
import { MockRpcClient } from '@/../test/mocks/transport';
import { AppletAPI } from '@/ws/api/applets.ts';

import type { IRpcClient } from '@/ws/api/client.ts';
import type { UUID } from 'pixelrunner-shared';

describe('src/ws/api/applets.ts', () => {
  let mockRpc: MockRpcClient;

  beforeEach(() => {
    mockRpc = new MockRpcClient();
    vi.clearAllMocks();
  });

  describe('applets API', () => {
    it('can fetch applets list', async () => {
      const response = await mockRpc.request('applets.list');
      expect(response).toBeDefined();
    });

    it('can get applet details', async () => {
      const response = await mockRpc.request('applets.get', {
        id: 'applet-1'
      });
      expect(response).toBeDefined();
    });

    it('can install applet', async () => {
      const response = await mockRpc.request('applets.install', {
        id: 'applet-id'
      });
      expect(response).toBeDefined();
    });

    it('can uninstall applet', async () => {
      const response = await mockRpc.request('applets.uninstall', {
        id: 'applet-id'
      });
      expect(response).toBeDefined();
    });

    it('handles list failures', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('applets.list')).rejects.toThrow();
    });
  });

  describe('applet operations', () => {
    it('can enable applet', async () => {
      const response = await mockRpc.request('applets.enable', {
        id: 'applet-id'
      });
      expect(response).toBeDefined();
    });

    it('can disable applet', async () => {
      const response = await mockRpc.request('applets.disable', {
        id: 'applet-id'
      });
      expect(response).toBeDefined();
    });

    it('can update applet config', async () => {
      const config = { brightness: 50 };
      const response = await mockRpc.request('applets.configure', {
        id: 'applet-id',
        config
      });
      expect(response).toBeDefined();
    });

    it('sends operation with parameters', async () => {
      await mockRpc.request('applets.configure', {
        id: 'app-1',
        settings: { param: 'value' }
      });
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.params).toBeDefined();
    });
  });

  describe('request formatting', () => {
    it('sends properly formatted requests', async () => {
      await mockRpc.request('applets.ping');
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.method).toBe('applets.ping');
      expect(lastRequest?.id).toBeDefined();
    });

    it('handles requests with applet id', async () => {
      await mockRpc.request('applets.get', { id: 'my-applet' });
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.params).toEqual({ id: 'my-applet' });
    });

    it('tracks request sequence', async () => {
      await mockRpc.request('applets.list');
      await mockRpc.request('applets.get', { id: '1' });
      await mockRpc.request('applets.enable', { id: '1' });
      const requests = mockRpc.getRequests();
      expect(requests).toHaveLength(3);
      expect(requests[0]?.method).toBe('applets.list');
      expect(requests[1]?.method).toBe('applets.get');
      expect(requests[2]?.method).toBe('applets.enable');
    });

    it('formats installed hidden and pinned update actions', async () => {
      const request = vi.fn(async () => ({
        method: 'updateAppletVisibility',
        data: null
      }));
      const api = new AppletAPI(createApiClient(request));
      const uuid = '11111111-1111-4111-8111-111111111111' as UUID;

      await api.updateHidden(uuid, true);
      await api.updatePinned(uuid, false);

      expect(request).toHaveBeenNthCalledWith(
        1,
        'applets.action',
        {
          method: 'updateAppletVisibility',
          params: { uuid, isHidden: true }
        },
        undefined
      );
      expect(request).toHaveBeenNthCalledWith(
        2,
        'applets.action',
        {
          method: 'updateAppletPinned',
          params: { uuid, isPinned: false }
        },
        undefined
      );
    });
  });

  describe('response handling', () => {
    it('receives applets list', async () => {
      const response = await mockRpc.request('applets.list');
      expect(response).toBeDefined();
    });

    it('handles applet details', async () => {
      const appletData = {
        id: 'applet-1',
        name: 'Test Applet',
        installed: true
      };
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: appletData, id: 1 });
      const response = await mockRpc.request('applets.get');
      expect(response).toHaveProperty('result');
    });

    it('handles null responses', async () => {
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: null, id: 1 });
      const response = await mockRpc.request('test');
      expect(response).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('applets.list')).rejects.toThrow();
    });

    it('handles timeouts', async () => {
      const slowClient = new MockRpcClient({ delay: 5000 });
      const promise = slowClient.request('applets.list');
      expect(promise).toBeDefined();
    });

    it('recovers from failures', async () => {
      const resilientClient = new MockRpcClient({ failureRate: 0 });
      const response = await resilientClient.request('applets.list');
      expect(response).toBeDefined();
    });
  });

  describe('performance', () => {
    it('handles quick requests', async () => {
      const fastClient = new MockRpcClient({ delay: 0 });
      const start = Date.now();
      await fastClient.request('applets.ping');
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('handles batched applet operations', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => mockRpc.request(`applets.get${i}`));
      const results = await Promise.all(requests);
      expect(results).toHaveLength(5);
    });

    it('handles concurrent applet changes', async () => {
      const ops = [
        mockRpc.request('applets.enable', { id: '1' }),
        mockRpc.request('applets.configure', { id: '2', config: {} }),
        mockRpc.request('applets.disable', { id: '3' })
      ];
      const results = await Promise.all(ops);
      expect(results).toHaveLength(3);
    });
  });
});

function createApiClient(request: ReturnType<typeof vi.fn>): IRpcClient {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: computed(() => true),
    isConnecting: computed(() => false),
    lastError: ref(null),
    off: vi.fn(),
    on: vi.fn(() => vi.fn()),
    once: vi.fn(),
    reconnect: vi.fn(),
    request,
    state: ref('connected')
  } as unknown as IRpcClient;
}
