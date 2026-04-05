declare module 'trystero' {
  interface RoomConfig {
    roomId: string;
    nostrRelays?: string[];
    joinSecret?: string;
    torrent?: boolean;
    trackerUrls?: string[];
  }

  interface Room {
    onPeerJoin(callback: (peerId: string) => void): void;
    onPeerLeave(callback: (peerId: string) => void): void;
    makeAction(actionName: string): (data: unknown) => void;
    on(actionName: string, callback: (data: unknown, peerId: string) => void): void;
    leave(): void;
    getPeers(): string[];
  }

  type JoinRoomResult = Room;

  export function joinRoom(config: RoomConfig): JoinRoomResult;
  export function createRoom(config: RoomConfig): JoinRoomResult;
  export function getPeerIdFromSecret(secret: string): string;

  export default {
    joinRoom,
    createRoom,
    getPeerIdFromSecret
  };
}
