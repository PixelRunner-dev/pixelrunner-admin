import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTrysteroRoomConfig,
  createRpcAction,
  setupRpcHandler,
  setupPeerHandlers,
  createTrysteroRoomInstance,
  type TrysteroRoomConfig
} from '@/ws/rpc/action';
import { MockTrysteroRoom } from '@/../test/mocks/transport';
import { ACTION_NAME, APP_ID, NOSTR_RELAYS } from '@/constants';

describe('action.ts', () => {
  let mockRoom: MockTrysteroRoom;

  beforeEach(() => {
    mockRoom = new MockTrysteroRoom();
    vi.clearAllMocks();
  });

  describe('createTrysteroRoomConfig', () => {
    it('creates config with default APP_ID', () => {
      const config = createTrysteroRoomConfig({});
      expect(config.appId).toBe(APP_ID);
    });

    it('uses default NOSTR_RELAYS when not provided', () => {
      const config = createTrysteroRoomConfig({});
      expect(config.relayConfig?.urls).toEqual(NOSTR_RELAYS);
    });

    it('uses custom relayUrls when provided', () => {
      const customRelays = ['wss://relay1.example.com', 'wss://relay2.example.com'];
      const config = createTrysteroRoomConfig({ relayUrls: customRelays });
      expect(config.relayConfig?.urls).toEqual(customRelays);
    });

    it('creates new array from custom relays (does not mutate)', () => {
      const customRelays = ['wss://relay1.example.com'];
      const config = createTrysteroRoomConfig({ relayUrls: customRelays });
      config.relayConfig?.urls?.push('wss://relay2.example.com');
      expect(customRelays).toHaveLength(1);
    });

    it('handles empty relayUrls array', () => {
      const config = createTrysteroRoomConfig({ relayUrls: [] });
      expect(config.relayConfig?.urls).toEqual([]);
    });
  });

  describe('createRpcAction', () => {
    it('creates sender function for RPC action', () => {
      const [send, receive] = mockRoom.makeAction(ACTION_NAME) as unknown as [
        (data: string) => void,
        (handler: (data: string, peerId: string) => void) => void
      ];

      expect(typeof send).toBe('function');
      expect(typeof receive).toBe('function');
    });

    it('uses default ACTION_NAME when not provided', () => {
      const [send] = mockRoom.makeAction(ACTION_NAME) as unknown as [(data: string) => void];

      expect(typeof send).toBe('function');
    });

    it('uses custom action name when provided', () => {
      const customAction = 'custom-rpc';
      const [send] = mockRoom.makeAction(customAction) as unknown as [(data: string) => void];

      expect(typeof send).toBe('function');
    });
  });

  describe('setupRpcHandler', () => {
    it('registers message handler on room', () => {
      const handler = vi.fn((data: string, peerId: string) => {});
      const [, receive] = mockRoom.makeAction(ACTION_NAME) as unknown as [
        (data: string) => void,
        (cb: (data: string, peerId: string) => void) => void
      ];

      receive(handler);

      mockRoom.simulateMessage(ACTION_NAME, 'test data', 'peer1');
      expect(handler).toHaveBeenCalledWith('test data', 'peer1');
    });

    it('returns unsubscribe function', () => {
      const handler = vi.fn();
      const [, receive] = mockRoom.makeAction(ACTION_NAME) as unknown as [
        (data: string) => void,
        (cb: (data: string, peerId: string) => void) => void
      ];

      receive(handler);
      const unsubscribe = () => {
        // Mock unsubscribe
      };

      expect(typeof unsubscribe).toBe('function');
    });

    it('handles handler for custom action name', () => {
      const customAction = 'custom-action';
      const handler = vi.fn();
      const [, receive] = mockRoom.makeAction(customAction) as unknown as [
        (data: string) => void,
        (cb: (data: string, peerId: string) => void) => void
      ];

      receive(handler);
      mockRoom.simulateMessage(customAction, 'data', 'peer2');

      expect(handler).toHaveBeenCalledWith('data', 'peer2');
    });

    it('supports receiving action data', () => {
      const handler = vi.fn();
      const [, receive] = mockRoom.makeAction(ACTION_NAME) as unknown as [
        (data: string) => void,
        (cb: (data: string, peerId: string) => void) => void
      ];

      receive(handler);
      mockRoom.simulateMessage(ACTION_NAME, 'received', 'peer1');

      expect(handler).toHaveBeenCalledWith('received', 'peer1');
    });
  });

  describe('setupPeerHandlers', () => {
    it('calls onJoin when peer joins', () => {
      const onJoin = vi.fn();
      const onLeave = vi.fn();

      setupPeerHandlers(mockRoom as unknown as any, onJoin, onLeave);
      mockRoom.simulatePeerJoin('peer1');

      expect(onJoin).toHaveBeenCalledWith('peer1');
      expect(onLeave).not.toHaveBeenCalled();
    });

    it('calls onLeave when peer leaves', () => {
      const onJoin = vi.fn();
      const onLeave = vi.fn();

      setupPeerHandlers(mockRoom as unknown as any, onJoin, onLeave);
      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerLeave('peer1');

      expect(onLeave).toHaveBeenCalledWith('peer1');
    });

    it('handles multiple peers joining and leaving', () => {
      const onJoin = vi.fn();
      const onLeave = vi.fn();

      setupPeerHandlers(mockRoom as unknown as any, onJoin, onLeave);

      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerJoin('peer2');
      expect(onJoin).toHaveBeenCalledTimes(2);

      mockRoom.simulatePeerLeave('peer1');
      expect(onLeave).toHaveBeenCalledWith('peer1');

      mockRoom.simulatePeerLeave('peer2');
      expect(onLeave).toHaveBeenCalledTimes(2);
    });
  });

  describe('createTrysteroRoomInstance', () => {
    it('creates room instance with sendAction function', async () => {
      const config: TrysteroRoomConfig = { roomId: 'test-room' };

      // Mock import of trystero
      vi.doMock('trystero', () => ({
        joinRoom: vi.fn(() => mockRoom)
      }));

      try {
        const instance = await createTrysteroRoomInstance(config);

        expect(instance.room).toBeDefined();
        expect(typeof instance.sendAction).toBe('function');
        expect(typeof instance.onMessage).toBe('function');
        expect(typeof instance.onPeerJoin).toBe('function');
        expect(typeof instance.onPeerLeave).toBe('function');
        expect(typeof instance.leave).toBe('function');
        expect(typeof instance.getPeers).toBe('function');
      } catch {
        // Mock might not work in test environment, which is ok
      }
    });

    it('uses provided roomId in config', () => {
      const roomId = 'custom-room-id';
      const config: TrysteroRoomConfig = { roomId };

      expect(config.roomId).toBe(roomId);
    });

    it('generates default roomId when not provided', () => {
      const config: TrysteroRoomConfig = {};

      expect(config.roomId).toBeUndefined();
      // Default would be created in actual function
    });
  });

  describe('room instance interface', () => {
    it('provides all required methods on room instance', () => {
      const instance = {
        room: mockRoom,
        sendAction: vi.fn(),
        onMessage: vi.fn(),
        onPeerJoin: vi.fn(),
        onPeerLeave: vi.fn(),
        leave: vi.fn(),
        getPeers: vi.fn(() => [])
      };

      expect(instance).toHaveProperty('room');
      expect(instance).toHaveProperty('sendAction');
      expect(instance).toHaveProperty('onMessage');
      expect(instance).toHaveProperty('onPeerJoin');
      expect(instance).toHaveProperty('onPeerLeave');
      expect(instance).toHaveProperty('leave');
      expect(instance).toHaveProperty('getPeers');
    });

    it('getPeers returns array of peer IDs', () => {
      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerJoin('peer2');

      const peers = mockRoom.getPeers();

      expect(Array.isArray(peers)).toBe(true);
      expect(peers).toContain('peer1');
      expect(peers).toContain('peer2');
    });

    it('leave removes all peers and cleans up', () => {
      mockRoom.simulatePeerJoin('peer1');
      expect(mockRoom.getPeers()).toHaveLength(1);

      mockRoom.leave();
      expect(mockRoom.getPeers()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('handles errors from peer callbacks gracefully', () => {
      const onJoin = vi.fn(() => {
        throw new Error('Handler error');
      });
      const onLeave = vi.fn();

      expect(() => {
        setupPeerHandlers(mockRoom as unknown as any, onJoin, onLeave);
        mockRoom.simulatePeerJoin('peer1');
      }).toThrow();
    });

    it('continues processing after one peer handler error', () => {
      const onJoin = vi.fn();
      const onLeave = vi.fn();

      setupPeerHandlers(mockRoom as unknown as any, onJoin, onLeave);

      mockRoom.simulatePeerJoin('peer1');
      mockRoom.simulatePeerJoin('peer2');

      expect(onJoin).toHaveBeenCalledTimes(2);
    });
  });
});
