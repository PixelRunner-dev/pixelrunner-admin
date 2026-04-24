import type { BaseRoomConfig, RelayConfig, TurnConfig } from 'trystero';
import { DEFAULT_WEBSOCKET_CONFIG, APP_ID, DEFAULT_TIMEOUT, ROOM_PREFIX } from '../constants.ts';
import { BaseWebSocketClient } from './base-client.ts';

import type {
  IJsonRpcResponse,
  IJsonRpcNotification,
  IWebSocketConfig,
  IConnectedEvent,
  IErrorEvent
} from 'pixelrunner-shared';

// Dynamic import for Trystero to handle potential SSR
let trystero: typeof import('trystero') | null = null;

/**
 * Configuration for Trystero-based WebRTC connections
 */
export interface TrysteroConfig extends IWebSocketConfig {
  roomId?: string;
  relayUrls?: string[];
  joinSecret?: string;
}

/**
 * TrysteroWebRTCClient provides a WebSocket-like interface using Trystero/WebRTC
 * for peer-to-peer connections. This allows the device to initiate the connection
 * via Nostr signaling, avoiding firewall issues.
 */
export class TrysteroWebRTCClient extends BaseWebSocketClient<TrysteroConfig> {
  // Private properties specific to Trystero
  private room: unknown = null;
  private sendAction: ((data: string) => void) | null = null;
  private receiveAction: ((data: string, peerId: string) => void) | null = null;
  private peerConnected: boolean = false;
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: TrysteroConfig) {
    super({
      ...DEFAULT_WEBSOCKET_CONFIG,
      ...config,
      url: '', // Override URL since we use Trystero
    });
  }

  // ============================================================================
  // Public Abstract Methods Implementation
  // ============================================================================

  public async connect(): Promise<void> {
    if (this.state.value === 'connected' || this.state.value === 'connecting') {
      return;
    }

    this.isIntentionalClose = false;
    this.state.value = 'connecting';
    this.clearReconnectTimer();

    return new Promise((resolve, reject) => {
      try {
        // Connection timeout
        const connectionTimeout = setTimeout(
          () => {
            if (this.state.value !== 'connected') {
              reject(new Error('Connection timeout'));
            }
          },
          this.getConfigNumber('timeout', DEFAULT_TIMEOUT)
        );

        this.connectTransport()
          .then(() => {
            clearTimeout(connectionTimeout);
            this.handleOpen();
            resolve();
          })
          .catch((error) => {
            clearTimeout(connectionTimeout);
            this.state.value = 'error';
            reject(error);
          });
      } catch (error) {
        this.state.value = 'error';
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    this.stopPeerMonitoring();
    this.disconnectTransport();
    this.rejectAllPendingRequests(new Error('WebSocket disconnected'));
    this.state.value = 'disconnected';
  }

  // ============================================================================
  // Protected Abstract Methods Implementation
  // ============================================================================

  protected async connectTransport(): Promise<void> {
    console.log('[trystero-client] connectTransport() called');

    if (!trystero) {
      console.log('[trystero-client] Loading trystero module...');
      trystero = await import('trystero');
      console.log('[trystero-client] Trystero module loaded');
    }

    const roomId = this.config.roomId || `${ROOM_PREFIX}-default`;
    console.log('[trystero-client] Room ID:', roomId);
    console.log('[trystero-client] Relay URLs:', this.config.relayUrls);
    console.log('[trystero-client] APP_ID:', APP_ID);

    const trysteroConfig: BaseRoomConfig & RelayConfig & TurnConfig = {
      appId: APP_ID,
      // Add STUN servers for NAT traversal
      rtcConfig: {
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:openrelay.metered.ca:80' }
        ]
      }
    };

    // Configure Nostr relays if provided
    if (this.config.relayUrls && this.config.relayUrls.length > 0) {
      trysteroConfig.relayUrls = this.config.relayUrls;
      console.log('[trystero-client] Relay URLs configured:', this.config.relayUrls);
    }

    // Add join secret for authentication if provided
    // if (this.config.joinSecret) {
    //   trysteroConfig.joinSecret = this.config.joinSecret;
    // }

    // Create the room (acts as host/join peer)
    console.log('[trystero-client] About to join room with config:', trysteroConfig, 'roomId:', roomId);
    this.room = trystero.joinRoom(trysteroConfig, roomId);
    console.log('[trystero-client] joinRoom() returned, room object created', Object.keys(this.room));

    this.setupRoomHandlers();
    this.startPeerMonitoring();
    await this.setupRpcAction();
  }

  private setupRoomHandlers(): void {
    if (!this.room) throw new Error('no room found');
    if (this.room.onPeerJoin) {
      this.room.onPeerJoin((peerId: string) => {
        console.log('[trystero-client] Peer joined:', peerId);
        this.peerConnected = true;
        this.handleOpen();
      });
    } else console.log('[trystero-client] No onPeerJoin event found');
    if (this.room.onPeerLeave) {
      this.room.onPeerLeave((peerId: string) => {
        console.log('[trystero-client] Peer left:', peerId);
        this.peerConnected = false;
        this.handleTransportClose(1000, 'Peer left', true);
      });
    } else console.log('[trystero-client] No onPeerLeave event found');
    if (this.room.onError) {
      this.room.onError((error: Error) => {
        console.error('[trystero-client] Room error:', error);
        this.handleTransportError(error);
      });
    } else console.log('[trystero-client] No onError event found');
    if (this.room.getPeers) {
      const existingPeers = this.room.getPeers();
      console.log('[trystero-client] Existing peers:', existingPeers);
      if (existingPeers.length > 0) {
        this.peerConnected = true;
        this.handleOpen();
      }
    } else console.log('[trystero-client] No getPeers event found');
    if (this.room.onStream) {
      this.room.onStream((stream: MediaStream, peerId: string) => {
        console.log('[trystero-client] Peer stream:', peerId, stream);
      });
    } else console.log('[trystero-client] No onStream event found');
    if (this.room.onSignalingReady) {
      this.room.onSignalingReady(() => {
        console.log('[trystero-client] Signaling ready');
      });
    }
  }

  private startPeerMonitoring(): void {
    this.connectionCheckInterval = setInterval(() => {
      if (this.room && this.room?.getPeers) {
        const peers = this.room.getPeers();
        console.log('[trystero-client] Peer check', peers.length, 'peers', peers);
        if (peers.length > 0 && !this.peerConnected) {
          console.log('[trystero-client] First peer detected');
          this.peerConnected = true;
          this.handleOpen();
        }
      }
    }, 2000);
  }

  private stopPeerMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private async setupRpcAction(): Promise<void> {
    // Create an action for RPC communication
    const actionName = 'rpc';
    try {
      const action = this.room.makeAction(actionName);
      console.log('[trystero] makeAction result:', typeof action,
        Array.isArray(action) ? `[${action.length} elements]` : action);

      if (!Array.isArray(action)) {
        throw new Error(`makeAction returned unexpected type: ${typeof action}`);
      }

      const [sender, receiver] = action;

      if (typeof sender !== 'function') {
        throw new Error(`Sender is not a function: ${typeof sender}`);
      }
      if (typeof receiver !== 'function') {
        throw new Error(`Receiver is not a function: ${typeof receiver}`);
      }

      this.sendAction = sender;
      this.receiveAction = receiver;

      receiver((data: string, peerId: string) => {
        console.log('[trystero-client] Received from peer', peerId, ':', data);
        this.handleTransportMessage(data);
      });

      console.log('[trystero] RPC action ready');
    } catch (error) {
      console.error('[trystero] Failed to setup RPC action:', error);
      throw error;
    }
  }

  protected disconnectTransport(): void {
    if (this.room) {
      try {
        if (this.room.leave) {
          this.room.leave();
        } catch (e) {
          console.log('[trystero] Error leaving room', e);
        }
      }
      this.room = null;
    }

    this.sendAction = null;
    this.receiveAction = null;
    this.peerConnected = false;
    console.log('[trystero] Transport disconnected');
  }

  protected send(message: string): void {
    if (!this.sendAction) {
      throw new Error('Not connected to peer');
      console.error('[trystero-client] Cannot send - no sendAction available');
    }

    if (!this.peerConnected) {
      console.error('[trystero] Cannot send - no peer connected');
      throw new Error('No peer connected');
    }

    console.log('[trystero-client] Sending message:', message);
    this.sendAction(message);
  }

  protected isTransportConnected(): boolean {
    console.log('isTransportConnected', this.sendAction, this.peerConnected);
    return this.sendAction !== null && this.peerConnected;
    //this.state.value === 'connected';
  }

  protected handleTransportError(error: unknown): void {
    if (this.config.debug) {
      console.error('[trystero] error:', error);
    }

    const errorEvent: IErrorEvent = {
      error: error instanceof Error ? error : new Error(String(error)),
      fatal: this.state.value === 'disconnected'
    };

    this.lastError.value = errorEvent.error;
    this.emit('error', errorEvent);
  }

  protected handleTransportMessage(data: unknown): void {
    try {
      // Handle string data only (Trystero typically sends strings)
      if (typeof data !== 'string') {
        console.warn('[trystero] Received non-string data:', typeof data);
        return;
      }

      const message = JSON.parse(data);

      if (!message) {
        console.log('[trystero] No message');
        return;
      }

      // Check if it's a response (has id) or notification (no id)
      if (message && typeof message === 'object' && 'id' in message) {
        this.handleResponse(message as IJsonRpcResponse);
      } else if (message && typeof message === 'object') {
        this.handleNotification(message as IJsonRpcNotification);
      }
    } catch (error) {
      console.error('[trystero] message parse error:', error);
    }
  }

  protected handleTransportClose(code: number, reason: string, wasClean: boolean): void {
    if (this.config.debug) {
      console.log('[trystero] closed:', code, reason);
    }

    // Use base class handleClose which handles reconnection logic
    this.handleClose(code, reason, wasClean);
  }

  // ============================================================================
  // Protected Override Methods
  // ============================================================================

  protected handleOpen(): void {
    if (this.state.value === 'connected') return;

    this.state.value = 'connected';
    this.lastError.value = null;
    const wasReconnect = this.reconnectAttempts > 0;
    this.reconnectAttempts = 0;

    console.log('[trystero] connected');

    // Emit connected event
    const event: IConnectedEvent = {
      timestamp: Date.now(),
      reconnectAttempt: wasReconnect ? this.reconnectAttempts : 0
    };

    this.emit('connected', event);

    if (wasReconnect) {
      this.emit('reconnected', event);
    }
  }

  private async checkRelayHealth(): Promise<boolean> {
    const relayStatus: Record<string, boolean> = {};

    for (const relayUrl of this.config.relayUrls || []) {
      try {
        const ws = new WebSocket(relayUrl);
        await new Promise((resolve, reject) => {
          ws.onopen = resolve;
          ws.onerror = reject;
          setTimeout(resolve, 3000); // Timeout
        });
        ws.close();
        relayStatus[relayUrl] = true;
        console.log(`[trystero] Relay ${relayUrl}: OK`);
      } catch {
        relayStatus[relayUrl] = false;
        console.error(`[trystero] Relay ${relayUrl}: FAILED`);
      }
    }

    return Object.values(relayStatus).some(v => v);
  }

}
