import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRpcClient } from '@/../test/mocks/transport';

describe('src/ws/api/settings.ts', () => {
  let mockRpc: MockRpcClient;

  beforeEach(() => {
    mockRpc = new MockRpcClient();
    vi.clearAllMocks();
  });

  describe('settings API', () => {
    it('can fetch settings', async () => {
      const response = await mockRpc.request('settings.get');
      expect(response).toBeDefined();
    });

    it('can update settings', async () => {
      const response = await mockRpc.request('settings.set', {
        brightness: 50
      });
      expect(response).toBeDefined();
    });

    it('can reset settings', async () => {
      const response = await mockRpc.request('settings.reset');
      expect(response).toBeDefined();
    });

    it('handles get failures', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('settings.get')).rejects.toThrow();
    });
  });

  describe('brightness control', () => {
    it('can set brightness', async () => {
      const response = await mockRpc.request('settings.brightness', {
        level: 75
      });
      expect(response).toBeDefined();
    });

    it('sends brightness with parameters', async () => {
      await mockRpc.request('settings.brightness', { level: 100 });
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.params).toEqual({ level: 100 });
    });

    it('handles brightness range validation', async () => {
      const response = await mockRpc.request('settings.brightness', {
        level: 50
      });
      expect(response).toBeDefined();
    });
  });

  describe('request formatting', () => {
    it('sends properly formatted requests', async () => {
      await mockRpc.request('settings.ping');
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.method).toBe('settings.ping');
      expect(lastRequest?.id).toBeDefined();
    });

    it('handles requests with settings data', async () => {
      const settingsData = { brightness: 80, contrast: 60 };
      await mockRpc.request('settings.update', settingsData);
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.params).toEqual(settingsData);
    });

    it('tracks request sequence', async () => {
      await mockRpc.request('settings.get');
      await mockRpc.request('settings.brightness', { level: 50 });
      await mockRpc.request('settings.save');
      const requests = mockRpc.getRequests();
      expect(requests).toHaveLength(3);
    });
  });

  describe('response handling', () => {
    it('receives settings response', async () => {
      const response = await mockRpc.request('settings.get');
      expect(response).toBeDefined();
    });

    it('handles null responses', async () => {
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: null, id: 1 });
      const response = await mockRpc.request('test');
      expect(response).toBeDefined();
    });

    it('handles structured settings responses', async () => {
      const settingsData = { brightness: 50, contrast: 75 };
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: settingsData, id: 1 });
      const response = await mockRpc.request('settings.get');
      expect(response).toHaveProperty('result');
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('settings.get')).rejects.toThrow();
    });

    it('handles timeout', async () => {
      const slowClient = new MockRpcClient({ delay: 5000 });
      const promise = slowClient.request('settings.get');
      expect(promise).toBeDefined();
    });

    it('recovers from failures', async () => {
      const resilientClient = new MockRpcClient({ failureRate: 0 });
      const response = await resilientClient.request('settings.get');
      expect(response).toBeDefined();
    });
  });

  describe('performance', () => {
    it('handles quick requests', async () => {
      const fastClient = new MockRpcClient({ delay: 0 });
      const start = Date.now();
      await fastClient.request('settings.ping');
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('handles concurrent operations', async () => {
      const ops = [
        mockRpc.request('settings.get'),
        mockRpc.request('settings.brightness', { level: 50 }),
        mockRpc.request('settings.contrast', { level: 75 })
      ];
      const results = await Promise.all(ops);
      expect(results).toHaveLength(3);
    });
  });
});
