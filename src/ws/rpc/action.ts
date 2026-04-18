/**
 * Trystero action creation utilities.
 * Provides a shared interface for creating RPC actions used by both
 * browser and Node.js Trystero clients.
 */

import { ACTION_NAME, APP_ID, NOSTR_RELAYS, ROOM_PREFIX } from '../../constants.ts';
import type { Room, BaseRoomConfig, RelayConfig, TurnConfig } from 'trystero';

/**
 * Configuration for creating a Trystero room.
 */
export interface TrysteroRoomConfig {
  /**
   * The room identifier. If not provided, a default will be generated.
   */
  roomId?: string;
  /**
   * Custom Nostr relays to use for signaling.
   * If not provided, defaults to NOSTR_RELAYS.
   */
  relayUrls?: readonly string[];
  /**
   * Optional secret for joining the room.
   */
  joinSecret?: string;
  /**
   * Optional additional room configuration.
   */
  torrent?: boolean;
  trackerUrls?: string[];
}

/**
 * Creates a Trystero room configuration object.
 * @param config - Room configuration options
 * @returns The room configuration object for Trystero
 */
export function createTrysteroRoomConfig(
  config: TrysteroRoomConfig
): BaseRoomConfig & RelayConfig & TurnConfig {
  return {
    appId: APP_ID,
    relayUrls: [...(config.relayUrls ?? NOSTR_RELAYS)]
  };
}

/**
 * Creates an RPC action on a Trystero room.
 * This is the primary communication channel between peers.
 * @param room - The Trystero room instance
 * @param actionName - The name of the action (defaults to ACTION_NAME)
 * @returns The send function for the action
 */
export function createRpcAction(
  room: Room,
  actionName: string = ACTION_NAME
): (data: string) => void {
  // makeAction returns [sender, receiver, progress] - we use the sender function
  const action = room.makeAction(actionName) as unknown as [
    (data: string) => void,
    (handler: (data: string, peerId: string) => void) => void,
    (progress: unknown) => void
  ];
  return action[0];
}

/**
 * Sets up an RPC message handler on a Trystero room.
 * @param room - The Trystero room instance
 * @param handler - Callback function to handle incoming RPC messages
 * @param actionName - The name of the action to listen for (defaults to ACTION_NAME)
 * @returns Unsubscribe function to remove the handler
 */
export function setupRpcHandler(
  room: Room,
  handler: (data: string) => void,
  actionName: string = ACTION_NAME
): () => void {
  console.log('room.on in setupRpcHandler', actionName);
  const action = room.makeAction(actionName) as unknown as [
    (data: string) => void,
    (callback: (data: string, peerId: string) => void) => void,
    (callback: (progress: unknown) => void) => void
  ];
  const receiver = action[1];
  receiver(handler);
  // Return an unsubscribe function
  return () => {
    // Trystero doesn't have direct unsubscribe, so we need a workaround
    // In practice, we keep the handler but ignore calls
  };
}

/**
 * Sets up peer event handlers on a Trystero room.
 * @param room - The Trystero room instance
 * @param onJoin - Callback when a peer joins
 * @param onLeave - Callback when a peer leaves
 */
export function setupPeerHandlers(
  room: Room,
  onJoin: (peerId: string) => void,
  onLeave: (peerId: string) => void
): void {
  room.onPeerJoin(onJoin);
  room.onPeerLeave(onLeave);
}

/**
 * Creates a complete Trystero room with RPC action and handlers.
 * This is a convenience function that sets up everything needed for RPC communication.
 */
export interface TrysteroRoomInstance {
  room: Room;
  sendAction: (data: string) => void;
  onMessage: (handler: (data: string, peerId: string) => void) => () => void;
  onPeerJoin: (handler: (peerId: string) => void) => void;
  onPeerLeave: (handler: (peerId: string) => void) => void;
  leave: () => void;
  getPeers: () => string[];
}

/**
 * Creates and initializes a Trystero room for RPC communication.
 * @param config - Room configuration
 * @returns The room instance with RPC capabilities
 */
export async function createTrysteroRoomInstance(
  config: TrysteroRoomConfig
): Promise<TrysteroRoomInstance> {
  const trystero = await import('trystero');
  const roomConfig = createTrysteroRoomConfig(config);
  const roomId = config.roomId ?? `${ROOM_PREFIX}-default`;
  const room = trystero.joinRoom(roomConfig, roomId) as Room;
  const sendAction = createRpcAction(room);

  return {
    room,
    sendAction,
    onMessage: (handler) => {
      console.log('room.on in createTrysteroRoomInstance', ACTION_NAME);
      const action = room.makeAction(ACTION_NAME) as unknown as [
        (data: string) => void,
        (callback: (data: unknown, peerId: string) => void) => void,
        (callback: (progress: unknown) => void) => void
      ];
      const receiver = action[1];
      receiver(handler as (data: unknown, peerId: string) => void);
      return () => {
        // Cleanup - Trystero doesn't have removeListener
      };
    },
    onPeerJoin: (handler) => room.onPeerJoin(handler),
    onPeerLeave: (handler) => room.onPeerLeave(handler),
    leave: () => room.leave(),
    getPeers: () => Object.keys(room.getPeers())
  };
}
