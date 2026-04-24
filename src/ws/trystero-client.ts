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
  private peerConnected: boolean = false;

  constructor(config?: TrysteroConfig) {
    super({
      ...DEFAULT_WEBSOCKET_CONFIG,
      ...config,
      // Override URL since we use Trystero
      url: ''
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

    console.log('[trystero-client] Trystero version check:', (trystero as unknown as { VERSION?: string }).VERSION || 'unknown');

    const roomId = this.config.roomId || `${ROOM_PREFIX}-default`;
    console.log('[trystero-client] Room ID:', roomId);

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
    console.log('[trystero-client] joinRoom() returned, room object created');

    // IMPORTANT: Use promise-based peer discovery
    // Trystero v0.22+ has a promise that resolves when peers join
    const roomAny = this.room;

    if (roomAny.onPeerJoin) {
      roomAny.onPeerJoin((peerId: string) => {
        console.log('[trystero-client] Peer joined:', peerId);
        this.peerConnected = true;
        this.handleOpen();
      });
    }
    if (roomAny.onPeerLeave) {
      roomAny.onPeerLeave((peerId: string) => {
        console.log('[trystero-client] Peer left:', peerId);
        this.peerConnected = false;
        this.handleTransportClose(1000, 'Peer left', true);
      });
    }
    if (roomAny.onError) {
      roomAny.onError((error: Error) => {
        console.error('[trystero-client] Room error:', error);
        this.handleTransportError(error);
      });
    }
    if (roomAny.getPeers) {
      const existingPeers = roomAny.getPeers();
      console.log('[trystero-client] Existing peers:', existingPeers);
      if (existingPeers.length > 0) {
        this.peerConnected = true;
        this.handleOpen();
      }
    }

    // Check for existing peers periodically
    const checkPeers = () => {
      if (roomAny.getPeers) {
        const peers = roomAny.getPeers();
        console.log('[trystero-client] Current peers:', peers);
        if (peers.length > 0 && !this.peerConnected) {
          this.peerConnected = true;
          this.handleOpen();
        }
      }
    };
    setTimeout(checkPeers, 3000);
    setTimeout(checkPeers, 6000);
    setTimeout(checkPeers, 9000);
    setTimeout(checkPeers, 12000);
    setTimeout(checkPeers, 15000);
    setTimeout(checkPeers, 18000);
    setTimeout(checkPeers, 21000);

    // Create an action for RPC communication
    const actionName = 'rpc';
    try {
      const action = roomAny.makeAction(actionName);
      console.log('[trystero-client] makeAction result type:', typeof action, Array.isArray(action));

      if (Array.isArray(action) && action.length >= 2) {
        this.sendAction = action[0];
        const receiver = action[1];

        receiver((data: string, peerId: string) => {
          console.log('[trystero-client] Received from peer', peerId, ':', data);
          this.handleTransportMessage(data);
        });

        console.log('[trystero-client] Action handlers set up successfully');
      } else {
        console.error('[trystero-client] Unexpected makeAction result:', action);
      }
    } catch (error) {
      console.error('[trystero-client] makeAction error:', error);
      throw error;
    }
  }

  protected disconnectTransport(): void {
    if (this.room) {
      (this.room as { leave: () => void }).leave();
      this.room = null;
    }

    this.sendAction = null;
  }

  protected send(message: string): void {
    if (this.sendAction) {
      console.log('[trystero-client] Sending message:', message);
      this.sendAction(message);

      if (this.config.debug) {
        console.log('[trystero-client] Message sent successfully');
      }
    } else {
      console.error('[trystero-client] Cannot send - no sendAction available');
    }
  }

  protected isTransportConnected(): boolean {
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
        return;
      }

      const message = this.parseMessage(data);

      if (!message) {
        return;
      }

      if (this.config.debug) {
        console.log('[trystero] received:', message);
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

    if (this.config.debug) {
      console.log('[trystero] connected');
    }

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
}
