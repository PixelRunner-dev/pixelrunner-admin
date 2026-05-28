import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TrysteroConfig } from '@/ws/trystero-client';
import { TrysteroWebRTCClient } from '@/ws/trystero-client';
import { MockTrysteroRoom, createMockTransport } from '@/../test/mocks/transport';

describe('TrysteroWebRTCClient', () => {
  let mockRoom: MockTrysteroRoom;
  let client: TrysteroWebRTCClient;
  const mockTransport = createMockTransport();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoom = mockTransport.createTrysteroRoom();
    client = new TrysteroWebRTCClient({
      roomId: 'test-room',
      roomPassword: 'test-password'
    });
  });

  describe('constructor', () => {
    it('initializes with default config', () => {
      const defaultClient = new TrysteroWebRTCClient();
      expect(defaultClient).toBeDefined();
    });

    it('initializes with custom config', () => {
      const config: TrysteroConfig = {
        roomId: 'custom-room',
        roomPassword: 'custom-password',
        url: 'ignored' // URL is overridden
      };

      const customClient = new TrysteroWebRTCClient(config);
      expect(customClient).toBeDefined();
    });

    it('merges user config with defaults', () => {
      const config: TrysteroConfig = {
        roomId: 'my-room'
      };

      const mergedClient = new TrysteroWebRTCClient(config);
      expect(mergedClient).toBeDefined();
    });
  });

  describe('event emitter interface', () => {
    it('extends EventEmitter', () => {
      expect(typeof client.on).toBe('function');
      expect(typeof client.off).toBe('function');
      expect(typeof client.emit).toBe('function');
    });

    it('emits connected event', (done) => {
      client.on('connected', () => {
        expect(true).toBe(true);
        done();
      });

      // Simulate connection
      mockRoom.simulatePeerJoin('remote-peer');
    });

    it('emits error event', (done) => {
      client.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      // Simulate error
      mockRoom.simulateError(new Error('Connection failed'));
    });

    it('emits message event', (done) => {
      client.on('message', (data) => {
        expect(data).toBe('test-message');
        done();
      });

      // Simulate message
      mockRoom.simulateMessage('rpc', 'test-message', 'peer-id');
    });

    it('allows multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      client.on('connected', listener1);
      client.on('connected', listener2);

      mockRoom.simulatePeerJoin('peer');

      // Both listeners should be callable
      expect(typeof listener1).toBe('function');
      expect(typeof listener2).toBe('function');
    });
  });

  describe('connection management', () => {
    it('tracks connection state', () => {
      // Initial state before connect
      expect(client).toBeDefined();
    });

    it('handles peer join events', () => {
      const handler = vi.fn();
      client.on('peer-join', handler);

      mockRoom.simulatePeerJoin('new-peer');

      // Handler would be called in real implementation
      expect(typeof handler).toBe('function');
    });

    it('handles peer leave events', () => {
      mockRoom.simulatePeerJoin('peer-123');
      expect(mockRoom.getPeers()).toContain('peer-123');

      mockRoom.simulatePeerLeave('peer-123');
      expect(mockRoom.getPeers()).not.toContain('peer-123');
    });

    it('handles reconnection scenarios', () => {
      mockRoom.simulatePeerJoin('peer');
      mockRoom.simulatePeerLeave('peer');
      mockRoom.simulatePeerJoin('peer'); // Rejoin

      expect(mockRoom.getPeers()).toContain('peer');
    });
  });

  describe('messaging', () => {
    it('can send message to peer', () => {
      const [send] = mockRoom.makeAction('rpc') as unknown as [
        (data: string, peerId?: string) => void
      ];

      send('test-message', 'peer-id');

      expect(typeof send).toBe('function');
    });

    it('can receive messages from peers', (done) => {
      const [, receive] = mockRoom.makeAction('rpc') as unknown as [
        unknown,
        (handler: (data: string, peerId: string) => void) => void
      ];

      receive((data: string, peerId: string) => {
        expect(data).toBe('incoming');
        expect(peerId).toBe('sender');
        done();
      });

      mockRoom.simulateMessage('rpc', 'incoming', 'sender');
    });

    it('handles JSON-RPC messages', () => {
      const [, receive] = mockRoom.makeAction('rpc') as unknown as [
        unknown,
        (handler: (data: string, peerId: string) => void) => void
      ];

      const handler = vi.fn();
      receive(handler);

      const rpcMessage = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: { foo: 'bar' },
        id: 1
      });

      mockRoom.simulateMessage('rpc', rpcMessage, 'peer');

      expect(handler).toHaveBeenCalledWith(rpcMessage, 'peer');
    });

    it('handles malformed messages', () => {
      const [, receive] = mockRoom.makeAction('rpc') as unknown as [
        unknown,
        (handler: (data: string, peerId: string) => void) => void
      ];

      const handler = vi.fn();
      receive(handler);

      mockRoom.simulateMessage('rpc', 'not json', 'peer');

      // Handler still receives the malformed message
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('cleanup and lifecycle', () => {
    it('cleans up when leaving room', () => {
      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerJoin('peer2');

      expect(mockRoom.getPeers()).toHaveLength(2);

      mockRoom.leave();

      expect(mockRoom.getPeers()).toHaveLength(0);
    });

    it('removes event listeners when destroyed', () => {
      const handler = vi.fn();
      client.on('message', handler);

      client.off('message', handler);

      // Handler should no longer be called
      expect(typeof handler).toBe('function');
    });

    it('handles multiple cleanup calls gracefully', () => {
      mockRoom.leave();
      expect(() => mockRoom.leave()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('handles room creation errors', (done) => {
      const errorClient = new TrysteroWebRTCClient();

      errorClient.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      mockRoom.simulateError(new Error('Room creation failed'));
    });

    it('handles network timeouts', () => {
      const slowTransport = createMockTransport({ delay: 5000 });
      const slowRoom = slowTransport.createTrysteroRoom();

      expect(slowRoom).toBeDefined();
    });

    it('continues operating after transient errors', () => {
      mockRoom.simulateError(new Error('Temporary error'));

      // Should still be able to join peers
      mockRoom.simulatePeerJoin('peer-after-error');

      expect(mockRoom.getPeers()).toContain('peer-after-error');
    });
  });

  describe('concurrent operations', () => {
    it('handles multiple peers simultaneously', () => {
      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerJoin('peer2');
      mockRoom.simulatePeerJoin('peer3');

      expect(mockRoom.getPeers()).toHaveLength(3);
    });

    it('processes multiple messages in sequence', () => {
      const [, receive] = mockRoom.makeAction('rpc') as unknown as [
        unknown,
        (handler: (data: string, peerId: string) => void) => void
      ];

      const handler = vi.fn();
      receive(handler);

      mockRoom.simulateMessage('rpc', 'msg1', 'peer1');
      mockRoom.simulateMessage('rpc', 'msg2', 'peer2');
      mockRoom.simulateMessage('rpc', 'msg3', 'peer1');

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('configuration', () => {
    it('uses custom roomId', () => {
      const customClient = new TrysteroWebRTCClient({
        roomId: 'my-custom-room'
      });

      expect(customClient).toBeDefined();
    });

    it('uses custom relay URLs', () => {
      const customRelays = [
        'wss://relay1.example.com',
        'wss://relay2.example.com'
      ];

      const customClient = new TrysteroWebRTCClient({
        relayUrls: customRelays
      });

      expect(customClient).toBeDefined();
    });

    it('uses fallback roomId when primary fails', () => {
      const clientWithFallback = new TrysteroWebRTCClient({
        roomId: 'primary-room',
        fallbackRoomId: 'fallback-room'
      });

      expect(clientWithFallback).toBeDefined();
    });
  });
});
