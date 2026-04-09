/**
 * Trystero Room - Node.js version
 *
 * This module provides Trystero room creation for the device-side (Node.js) script.
 * It wraps the browser-based Trystero library for use in the device-proxy.mjs script.
 *
 * The device runs on a Raspberry Pi and uses Trystero for WebRTC peer-to-peer
 * communication with the browser-based admin interface.
 */

import { NOSTR_RELAYS, APP_ID, ACTION_NAME } from '../../src/constants.ts';
import type { Room, RoomConfig } from 'trystero';

/**
 * Configuration for the Trystero room on the device side.
 */
export interface DeviceTrysteroConfig {
  /**
   * The device identifier used to form the room ID.
   * e.g., "pxlr_f91a"
   */
  deviceId: string;
  /**
   * Custom Nostr relays (defaults to NOSTR_RELAYS from constants)
   */
  nostrRelays?: readonly string[];
  /**
   * Optional join secret for authentication
   */
  joinSecret?: string;
}

/**
 * Creates a Trystero room config object for the device.
 * @param config - Device configuration
 * @returns RoomConfig for Trystero
 */
function createRoomConfig(config: DeviceTrysteroConfig): RoomConfig {
  return {
    roomId: `pixelrunner-${config.deviceId}`,
    appId: APP_ID,
    nostrRelays: [...(config.nostrRelays ?? NOSTR_RELAYS)],
    ...(config.joinSecret && { joinSecret: config.joinSecret })
  };
}

/**
 * Device Trystero Room wrapper
 * Provides a clean interface for the device-proxy to use Trystero.
 */
export interface DeviceRoom {
  /**
   * The underlying Trystero room
   */
  room: Room;
  /**
   * Send an RPC message to all peers
   */
  send: (data: string) => void;
  /**
   * Handle incoming RPC messages
   */
  onMessage: (handler: (data: string) => void) => void;
  /**
   * Handle peer join events
   */
  onPeerJoin: (handler: (peerId: string) => void) => void;
  /**
   * Handle peer leave events
   */
  onPeerLeave: (handler: (peerId: string) => void) => void;
  /**
   * Leave the room and cleanup
   */
  leave: () => void;
}

/**
 * Creates and initializes a Trystero room for the device.
 * @param config - Device Trystero configuration
 * @returns Promise resolving to the device room wrapper
 */
export async function createDeviceRoom(config: DeviceTrysteroConfig): Promise<DeviceRoom> {
  const trystero = await import('trystero');
  const roomConfig = createRoomConfig(config);
  const room = trystero.joinRoom(roomConfig) as Room;

  // Create the RPC action for sending messages
  const action = room.makeAction(ACTION_NAME) as unknown as [
    (data: string) => void,
    (data: unknown) => void,
    (progress: unknown) => void
  ];
  const send = action[0];

  return {
    room,
    send,
    onMessage: (handler) => {
      room.on(ACTION_NAME, handler as (data: unknown, peerId: string) => void);
    },
    onPeerJoin: (handler) => room.onPeerJoin(handler),
    onPeerLeave: (handler) => room.onPeerLeave(handler),
    leave: () => room.leave()
  };
}

/**
 * Creates a Trystero room instance with a specific room ID.
 * Use this when you need more control over the room configuration.
 */
export async function createTrysteroRoom(
  roomId: string,
  nostrRelays?: readonly string[]
): Promise<DeviceRoom> {
  const trystero = await import('trystero');

  const roomConfig: RoomConfig = {
    roomId,
    appId: APP_ID,
    nostrRelays: nostrRelays ? [...nostrRelays] : [...NOSTR_RELAYS]
  };

  const room = trystero.joinRoom(roomConfig) as Room;
  const action = room.makeAction(ACTION_NAME) as unknown as [
    (data: string) => void,
    (data: unknown) => void,
    (progress: unknown) => void
  ];
  const send = action[0];

  return {
    room,
    send,
    onMessage: (handler) => {
      room.on(ACTION_NAME, handler as (data: unknown, peerId: string) => void);
    },
    onPeerJoin: (handler) => room.onPeerJoin(handler),
    onPeerLeave: (handler) => room.onPeerLeave(handler),
    leave: () => room.leave()
  };
}
