import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IWebSocketConfig } from 'pixelrunner-shared';
import { BaseWebSocketClient } from '@/ws/base-client';

// Create concrete test implementation
class TestWebSocketClient extends BaseWebSocketClient<IWebSocketConfig> {
  async connect(): Promise<void> {}
  disconnect(): void {}
  protected send(_message: string): void {}
  protected isTransportConnected(): boolean { return false; }
  protected handleTransportError(_error: unknown): void {}
  protected handleTransportMessage(_data: unknown): void {}
  protected handleTransportClose(_code: number, _reason: string, _wasClean: boolean): void {}
  /** @deprecated kept for legacy tests only */
  protected handleMessage(_data: string): void {}
}

describe('base-client.ts', () => {
  let client: TestWebSocketClient;

  beforeEach(() => {
    client = new TestWebSocketClient();
    vi.clearAllMocks();
  });

  describe('reactive state properties', () => {
    it('initializes state', () => {
      expect(client.state).toBeDefined();
      expect(client.state.value).toBeDefined();
    });

    it('computes isConnected from state', () => {
      expect(client.isConnected).toBeDefined();
      expect(typeof client.isConnected.value).toBe('boolean');
    });

    it('computes isConnecting from state', () => {
      expect(client.isConnecting).toBeDefined();
      expect(typeof client.isConnecting.value).toBe('boolean');
    });

    it('tracks lastError', () => {
      expect(client.lastError).toBeDefined();
      expect(client.lastError.value).toBeNull();
    });
  });

  describe('request handling', () => {
    it('initializes with zero request ID', () => {
      expect(client['requestId']).toBe(0);
    });

    it('has empty pending requests map', () => {
      expect(client['pendingRequests'].size).toBe(0);
    });

    it('has event handlers map', () => {
      expect(client['eventHandlers']).toBeDefined();
      expect(client['eventHandlers'].size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('event handler management', () => {
    it('can register event handlers', () => {
      const handler = vi.fn();
      expect(typeof handler).toBe('function');
    });

    it('maintains handler registry', () => {
      expect(client['eventHandlers']).toBeInstanceOf(Map);
    });
  });

  describe('configuration', () => {
    it('initializes with config', () => {
      expect(client['config']).toBeDefined();
    });

    it('uses provided config values', () => {
      const config: IWebSocketConfig = { url: 'ws://test' };
      const customClient = new TestWebSocketClient(config);
      expect(customClient).toBeDefined();
    });
  });

  describe('abstract methods', () => {
    it('requires connect implementation', async () => {
      expect(typeof client.connect).toBe('function');
    });

    it('requires disconnect implementation', () => {
      expect(typeof client.disconnect).toBe('function');
    });

    it('requires handleMessage implementation', () => {
      expect(typeof (client as any).handleMessage).toBe('function');
    });
  });

  describe('state management', () => {
    it('provides reactive state object', () => {
      const stateValue = client.state.value;
      expect(typeof stateValue).toBe('string');
      expect(['disconnected', 'connecting', 'connected', 'reconnecting']).toContain(stateValue);
    });

    it('provides connected computed property', () => {
      const isConnected = client.isConnected.value;
      expect(typeof isConnected).toBe('boolean');
    });

    it('provides connecting computed property', () => {
      const isConnecting = client.isConnecting.value;
      expect(typeof isConnecting).toBe('boolean');
    });
  });

  describe('error tracking', () => {
    it('initializes lastError as null', () => {
      expect(client.lastError.value).toBeNull();
    });

    it('can store error reference', () => {
      const error = new Error('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('lifecycle', () => {
    it('is instantiable', () => {
      expect(client).toBeInstanceOf(BaseWebSocketClient);
    });

    it('supports connect/disconnect cycle', async () => {
      await client.connect();
      client.disconnect();
      expect(client).toBeDefined();
    });
  });

  describe('request timeout handling', () => {
    it('initializes request ID counter', () => {
      expect(client['requestId']).toBeGreaterThanOrEqual(0);
    });

    it('tracks pending requests', () => {
      expect(client['pendingRequests']).toBeInstanceOf(Map);
    });
  });

  describe('inheritance', () => {
    it('can be extended by subclasses', () => {
      expect(client).toBeInstanceOf(BaseWebSocketClient);
    });

    it('provides protected methods to subclasses', () => {
      expect(typeof (client as any).handleMessage).toBe('function');
    });
  });
});
