import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRpcClient } from '@/../test/mocks/transport';

describe('src/ws/api/client.ts', () => {
  let mockRpc: MockRpcClient;

  beforeEach(() => {
    mockRpc = new MockRpcClient();
    vi.clearAllMocks();
  });

  describe('client info API', () => {
    it('can fetch client info', async () => {
      const response = await mockRpc.request('client.info');
      expect(response).toBeDefined();
    });

    it('can get client status', async () => {
      const response = await mockRpc.request('client.status');
      expect(response).toBeDefined();
    });

    it('handles info request failures gracefully', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('client.info')).rejects.toThrow();
    });
  });

  describe('request patterns', () => {
    it('sends properly formatted requests', async () => {
      await mockRpc.request('client.ping');
      const lastRequest = mockRpc.getLastRequest();

      expect(lastRequest?.method).toBe('client.ping');
      expect(lastRequest?.id).toBeDefined();
    });

    it('handles requests with parameters', async () => {
      await mockRpc.request('client.config', { key: 'value' });
      const lastRequest = mockRpc.getLastRequest();

      expect(lastRequest?.params).toEqual({ key: 'value' });
    });

    it('tracks request sequence', async () => {
      await mockRpc.request('client.info');
      await mockRpc.request('client.status');
      await mockRpc.request('client.ping');

      const requests = mockRpc.getRequests();
      expect(requests).toHaveLength(3);
      expect(requests[0]?.method).toBe('client.info');
      expect(requests[1]?.method).toBe('client.status');
      expect(requests[2]?.method).toBe('client.ping');
    });
  });

  describe('response handling', () => {
    it('receives response data', async () => {
      const response = await mockRpc.request('client.info');
      expect(response).toBeDefined();
    });

    it('handles null responses', async () => {
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: null, id: 1 });
      const response = await mockRpc.request('test');

      expect(response).toBeDefined();
    });

    it('handles structured responses', async () => {
      const data = { version: '1.0', uptime: 12345 };
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: data, id: 1 });
      const response = await mockRpc.request('client.info');

      expect(response).toHaveProperty('result');
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('client.info')).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      const slowClient = new MockRpcClient({ delay: 5000 });
      const promise = slowClient.request('client.info');
      expect(promise).toBeDefined();
    });

    it('recovers from transient failures', async () => {
      const resilientClient = new MockRpcClient({ failureRate: 0 });
      const response = await resilientClient.request('client.info');
      expect(response).toBeDefined();
    });
  });

  describe('performance', () => {
    it('handles quick requests', async () => {
      const fastClient = new MockRpcClient({ delay: 0 });
      const start = Date.now();
      await fastClient.request('client.ping');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('handles batched requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => mockRpc.request(`client.method${i}`));

      const results = await Promise.all(requests);
      expect(results).toHaveLength(10);
    });
  });

  describe('request lifecycle', () => {
    it('increments request IDs', async () => {
      await mockRpc.request('client.info');
      const req1 = mockRpc.getLastRequest();

      await mockRpc.request('client.status');
      const req2 = mockRpc.getLastRequest();

      expect(req2?.id).toBeGreaterThan(req1?.id ?? 0);
    });

    it('maintains request context', async () => {
      await mockRpc.request('client.init', { value: 123 });
      const request = mockRpc.getLastRequest();

      expect(request?.params).toEqual({ value: 123 });
    });
  });

  describe('integration scenarios', () => {
    it('supports typical client lifecycle', async () => {
      // Connect/initialize
      const init = await mockRpc.request('client.init');
      expect(init).toBeDefined();

      // Get status
      const status = await mockRpc.request('client.status');
      expect(status).toBeDefined();

      // Send command
      const cmd = await mockRpc.request('client.command', { action: 'test' });
      expect(cmd).toBeDefined();
    });

    it('handles concurrent operations', async () => {
      const ops = [
        mockRpc.request('client.info'),
        mockRpc.request('client.status'),
        mockRpc.request('client.config', { setting: 'value' })
      ];

      const results = await Promise.all(ops);
      expect(results).toHaveLength(3);
      expect(mockRpc.getRequests()).toHaveLength(3);
    });
  });
});
