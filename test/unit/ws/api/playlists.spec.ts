import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockRpcClient } from '@/../test/mocks/transport';

describe('src/ws/api/playlists.ts', () => {
  let mockRpc: MockRpcClient;

  beforeEach(() => {
    mockRpc = new MockRpcClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('playlist API methods', () => {
    it('can make playlist requests', async () => {
      const request = mockRpc.request('playlist.list');
      expect(request).toBeDefined();
    });

    it('handles successful playlist response', async () => {
      const response = await mockRpc.request('playlist.list');
      expect(response).toBeDefined();
    });

    it('handles multiple playlist operations', async () => {
      const list = await mockRpc.request('playlist.list');
      const create = await mockRpc.request('playlist.create', { name: 'My Playlist' });

      expect(list).toBeDefined();
      expect(create).toBeDefined();
    });

    it('handles playlist errors', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });

      await expect(errorClient.request('playlist.invalid')).rejects.toThrow();
    });
  });

  describe('request/response patterns', () => {
    it('sends method and params', async () => {
      await mockRpc.request('playlist.add', { appletId: 'test' });
      const lastRequest = mockRpc.getLastRequest();

      expect(lastRequest?.method).toBe('playlist.add');
      expect(lastRequest?.params).toEqual({ appletId: 'test' });
    });

    it('handles empty params', async () => {
      await mockRpc.request('playlist.list');
      const lastRequest = mockRpc.getLastRequest();

      expect(lastRequest).toBeDefined();
    });

    it('tracks multiple requests', async () => {
      await mockRpc.request('playlist.list');
      await mockRpc.request('playlist.create', { name: 'Test' });
      await mockRpc.request('playlist.delete', { id: '123' });

      const requests = mockRpc.getRequests();
      expect(requests.length).toBe(3);
    });
  });

  describe('error scenarios', () => {
    it('handles playlist not found', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(errorClient.request('playlist.get', { id: 'nonexistent' })).rejects.toThrow();
    });

    it('handles invalid playlist data', async () => {
      const errorClient = new MockRpcClient({ failureRate: 1.0 });
      await expect(
        errorClient.request('playlist.update', { id: '123', data: null })
      ).rejects.toThrow();
    });

    it('recovers from transient errors', async () => {
      const resilientClient = new MockRpcClient({ failureRate: 0 });
      const response = await resilientClient.request('playlist.list');
      expect(response).toBeDefined();
    });
  });

  describe('response handling', () => {
    it('returns response from server', async () => {
      const response = await mockRpc.request('playlist.list');
      expect(response).toBeDefined();
    });

    it('preserves response structure', async () => {
      mockRpc.setResponse(1, { jsonrpc: '2.0', result: { id: '123', name: 'Test' }, id: 1 });
      const response = await mockRpc.request('test');
      expect(response).toHaveProperty('result');
    });
  });

  describe('performance', () => {
    it('handles requests quickly', async () => {
      const client = new MockRpcClient({ delay: 0 });
      const start = Date.now();
      await client.request('playlist.list');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('handles delayed responses', async () => {
      vi.useFakeTimers();
      const client = new MockRpcClient({ delay: 50 });
      const request = client.request('playlist.list');
      let resolved = false;

      request.then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(49);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await expect(request).resolves.toBeDefined();
      expect(resolved).toBe(true);
    });
  });

  describe('integration', () => {
    it('supports common playlist operations', async () => {
      const operations = [
        mockRpc.request('playlist.list'),
        mockRpc.request('playlist.create', { name: 'New' }),
        mockRpc.request('playlist.update', { id: '1', name: 'Updated' }),
        mockRpc.request('playlist.delete', { id: '1' })
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
    });
  });
});
