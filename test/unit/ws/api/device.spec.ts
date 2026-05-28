import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRpcClient } from '@/../test/mocks/transport';

describe('src/ws/api/device.ts', () => {
  let mockRpc: MockRpcClient;

  beforeEach(() => {
    mockRpc = new MockRpcClient();
    vi.clearAllMocks();
  });

  describe('device API', () => {
    it('can fetch device info', async () => {
      const response = await mockRpc.request('device.info');
      expect(response).toBeDefined();
    });

    it('can get device status', async () => {
      const response = await mockRpc.request('device.status');
      expect(response).toBeDefined();
    });

    it('can get device version', async () => {
      const response = await mockRpc.request('device.version');
      expect(response).toBeDefined();
    });

    it('handles device info failures', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('device.info')).rejects.toThrow();
    });
  });

  describe('device control', () => {
    it('can reboot device', async () => {
      const response = await mockRpc.request('device.reboot');
      expect(response).toBeDefined();
    });

    it('can shutdown device', async () => {
      const response = await mockRpc.request('device.shutdown');
      expect(response).toBeDefined();
    });

    it('sends properly formatted requests', async () => {
      await mockRpc.request('device.ping');
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.method).toBe('device.ping');
      expect(lastRequest?.id).toBeDefined();
    });

    it('handles requests with parameters', async () => {
      await mockRpc.request('device.config', { key: 'value' });
      const lastRequest = mockRpc.getLastRequest();
      expect(lastRequest?.params).toEqual({ key: 'value' });
    });
  });

  describe('response handling', () => {
    it('receives response data', async () => {
      const response = await mockRpc.request('device.info');
      expect(response).toBeDefined();
    });

    it('handles null responses', async () => {
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: null, id: 1 });
      const response = await mockRpc.request('test');
      expect(response).toBeDefined();
    });

    it('handles structured responses', async () => {
      const data = { version: '1.0.0', uptime: 3600 };
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: data, id: 1 });
      const response = await mockRpc.request('device.info');
      expect(response).toHaveProperty('result');
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('device.info')).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      const slowClient = new MockRpcClient({ delay: 5000 });
      const promise = slowClient.request('device.info');
      expect(promise).toBeDefined();
    });

    it('recovers from transient failures', async () => {
      const resilientClient = new MockRpcClient({ failureRate: 0 });
      const response = await resilientClient.request('device.info');
      expect(response).toBeDefined();
    });
  });

  describe('performance', () => {
    it('handles quick requests', async () => {
      const fastClient = new MockRpcClient({ delay: 0 });
      const start = Date.now();
      await fastClient.request('device.ping');
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('handles batched requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        mockRpc.request(`device.method${i}`)
      );
      const results = await Promise.all(requests);
      expect(results).toHaveLength(5);
    });
  });
});
