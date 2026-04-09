import { DEFAULT_WEBSOCKET_CONFIG, APP_ID, DEFAULT_TIMEOUT } from '../constants.ts';
import { BaseWebSocketClient } from './base-client.ts';

import type {
  IJsonRpcResponse,
  IJsonRpcNotification,
  IWebSocketConfig,
  IConnectedEvent,
  IErrorEvent
} from 'pixelrunner-shared/lib/interfaces/index.ts';

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
    if (!trystero) {
      trystero = await import('trystero');
    }

    const roomId = this.config.roomId || 'pixelrunner-default';

    const trysteroConfig: Record<string, unknown> = {
      appId: APP_ID
    };

    // Configure Nostr relays if provided
    if (this.config.relayUrls && this.config.relayUrls.length > 0) {
      trysteroConfig.relayUrls = this.config.relayUrls;
    }

    // Add join secret for authentication if provided
    if (this.config.joinSecret) {
      trysteroConfig.joinSecret = this.config.joinSecret;
    }

    // Create the room (acts as host/join peer)
    this.room = trystero.joinRoom({
      roomId,
      ...trysteroConfig
    });

    // Set up peer join handler
    (this.room as { onPeerJoin: (cb: () => void) => void }).onPeerJoin(() => {
      console.log('[trystero] Peer joined');
    });

    // Set up peer leave handler
    (this.room as { onPeerLeave: (cb: () => void) => void }).onPeerLeave(() => {
      console.log('[trystero] Peer left');
      this.handleTransportClose(1000, 'Peer left', true);
    });

    // Create an action for RPC communication
    const actionName = 'rpc';
    this.sendAction = (this.room as { makeAction: (name: string) => unknown }).makeAction(
      actionName
    ) as (data: string) => void;

    // Set up the receiver
    (this.room as { on: (name: string, cb: (data: string) => void) => void }).on(
      actionName,
      (data: string) => {
        this.handleTransportMessage(data);
      }
    );
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
      this.sendAction(message);

      if (this.config.debug) {
        console.log('[trystero] sent:', message);
      }
    }
  }

  protected isTransportConnected(): boolean {
    return this.sendAction !== null && this.state.value === 'connected';
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
