import type { JoinRoomConfig, JsonValue } from 'trystero';
import {
  ACTION_NAME,
  DEFAULT_WEBSOCKET_CONFIG,
  APP_ID,
  DEFAULT_TIMEOUT,
  ROOM_PASSWORD as DEFAULT_ROOM_PASSWORD
} from '../constants.ts';
import { BaseWebSocketClient } from './base-client.ts';

import type {
  IJsonRpcResponse,
  IJsonRpcNotification,
  IWebSocketConfig,
  IConnectedEvent,
  IErrorEvent
} from 'pixelrunner-shared';
import { controllerConnectionLost } from '@/utils/controllerConnectionState.ts';
import { resolveTrysteroRoomId } from '@/ws/room-id.ts';

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.xs4all.nl:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' }
];
const CONTROLLER_CONNECTION_LOST_DELAY_MS = 10_000;

// Dynamic import for Trystero to handle potential SSR
let trystero: typeof import('trystero') | null = null;
let relaySocketDebugInstalled = false;
let webRtcDebugInstalled = false;

interface TrysteroRoomLike {
  leave?: () => void;
  getPeers?: () => string[] | Record<string, unknown>;
  onPeerJoin?: ((peerId: string) => void) | null;
  onPeerLeave?: ((peerId: string) => void) | null;
  onError?: (handler: (error: Error) => void) => void;
  onStream?: (handler: (stream: MediaStream, peerId: string) => void) => void;
  onPeerStream?: ((stream: MediaStream, peerId: string, metadata?: JsonValue) => void) | null;
  onSignalingReady?: (handler: () => void) => void;
  makeAction: (actionName: string) => unknown;
}

/**
 * Configuration for Trystero-based WebRTC connections
 */
export interface TrysteroConfig extends IWebSocketConfig {
  roomId?: string;
  fallbackRoomId?: string;
  roomPassword?: string;
  relayUrls?: string[];
  joinSecret?: string;
  iceServers?: RTCIceServer[];
}

/**
 * TrysteroWebRTCClient provides a WebSocket-like interface using Trystero/WebRTC
 * for peer-to-peer connections. This allows the device to initiate the connection
 * via Nostr signaling, avoiding firewall issues.
 */
export class TrysteroWebRTCClient extends BaseWebSocketClient<TrysteroConfig> {
  // Private properties specific to Trystero
  private room: TrysteroRoomLike | null = null;
  private sendAction: ((data: string, peerId?: string) => void) | null = null;
  private receiveAction: ((data: string, peerId: string) => void) | null = null;
  private peerConnected: boolean = false;
  private hasConnectedPeer: boolean = false;
  private controllerConnectionLostTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: TrysteroConfig) {
    super({
      ...DEFAULT_WEBSOCKET_CONFIG,
      ...config,
      url: '' // Override URL since we use Trystero
    });
  }

  // ============================================================================
  // Public Abstract Methods Implementation
  // ============================================================================

  public async connect(): Promise<void> {
    if (
      this.state.value === 'connected' ||
      this.state.value === 'connecting' ||
      this.state.value === 'reconnecting'
    ) {
      return;
    }

    this.isIntentionalClose = false;
    this.state.value = 'connecting';
    this.clearReconnectTimer();

    return new Promise((resolve, reject) => {
      let settled = false;
      let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        unsubscribeConnected();
        unsubscribeError();
      };

      const resolveOnce = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.lastError.value = error;
        this.emit('error', {
          error,
          fatal: true
        });
        this.stopPeerMonitoring();
        this.disconnectTransport();
        this.state.value = 'error';
        if (
          !this.isIntentionalClose &&
          this.config.reconnect &&
          this.reconnectAttempts < this.getConfigNumber('maxReconnectAttempts', Infinity)
        ) {
          this.scheduleReconnect();
        }
        reject(error);
      };

      const unsubscribeConnected = this.on('connected', () => {
        resolveOnce();
      });

      const unsubscribeError = this.on('error', (event) => {
        rejectOnce(event.error);
      });

      try {
        connectionTimeout = setTimeout(
          () => {
            if (this.state.value !== 'connected') {
              rejectOnce(new Error('Connection timeout'));
            }
          },
          this.getConfigNumber('timeout', DEFAULT_TIMEOUT)
        );

        this.connectTransport()
          .then(() => {
            if (this.state.value === 'connected') {
              resolveOnce();
            }
          })
          .catch((error) => {
            rejectOnce(error instanceof Error ? error : new Error(String(error)));
          });
      } catch (error) {
        rejectOnce(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    this.stopPeerMonitoring();
    this.clearControllerConnectionLostTimer();
    controllerConnectionLost.value = false;
    this.disconnectTransport();
    this.rejectAllPendingRequests(new Error('WebSocket disconnected'));
    this.state.value = 'disconnected';
  }

  // ============================================================================
  // Protected Abstract Methods Implementation
  // ============================================================================

  protected async connectTransport(): Promise<void> {
    console.log('[trystero-client] connectTransport() called');
    if (this.config.debug) {
      this.installRelaySocketDebugging();
    }
    // this.installWebRtcDebugging();

    if (!trystero) {
      console.log('[trystero-client] Loading trystero module...');
      trystero = await import('trystero');
      console.log('[trystero-client] Trystero module loaded');
      console.log('[trystero-client] selfId:', trystero.selfId);
    }

    const roomPassword = this.config.roomPassword ?? DEFAULT_ROOM_PASSWORD;
    const roomId = await resolveTrysteroRoomId(this.config.roomId, {
      password: roomPassword,
      fallbackRoomId: this.config.fallbackRoomId
    });
    console.log('[trystero-client] Room ID:', roomId);
    console.log('[trystero-client] Relay URLs:', this.config.relayUrls);
    console.log('[trystero-client] APP_ID:', APP_ID);
    await this.logDerivedTopics(roomId);

    const trysteroConfig: JoinRoomConfig = {
      appId: APP_ID,
      password: roomPassword,
      // Add STUN servers for NAT traversal
      rtcConfig: {
        iceServers: this.config.iceServers ?? DEFAULT_ICE_SERVERS
      }
    };

    // Configure Nostr relays if provided
    if (this.config.relayUrls && this.config.relayUrls.length > 0) {
      trysteroConfig.relayConfig = { urls: this.config.relayUrls };
      console.log('[trystero-client] Relay URLs configured:', this.config.relayUrls);
      console.log('[trystero-client] Checking relay health...');
      const relayHealth = await this.checkRelayHealth();
      console.log('[trystero-client] Relay health:', relayHealth);
      if (!Object.values(relayHealth).some(Boolean)) {
        throw new Error('No Nostr relays reachable from browser');
      }
    }

    // Add join secret for authentication if provided
    // if (this.config.joinSecret) {
    //   trysteroConfig.joinSecret = this.config.joinSecret;
    // }

    // Create the room (acts as host/join peer)
    console.log('[trystero-client] About to join room:', {
      roomId,
      appId: trysteroConfig.appId,
      relayUrls: this.config.relayUrls,
      iceServerCount: trysteroConfig.rtcConfig?.iceServers?.length ?? 0
    });
    this.room = trystero.joinRoom(trysteroConfig, roomId, {
      onJoinError: (details) => {
        const error = new Error(details.error);
        console.error('[trystero-client] Join error:', details);
        this.handleTransportError(error);
      }
    });
    // console.log(
    //   '[trystero-client] joinRoom() returned, room object created',
    //   Object.keys(this.room)
    // );

    this.setupRoomHandlers();
    this.startPeerMonitoring();
    await this.setupRpcAction();
    this.tryOpenConnection('rpc action ready');
  }

  private setupRoomHandlers(): void {
    if (!this.room) throw new Error('no room found');
    this.room.onPeerJoin = (peerId: string) => {
      console.log('[trystero-client] Peer joined:', peerId);
      this.handlePeersAvailable('peer joined');
    };
    this.room.onPeerLeave = (peerId: string) => {
      console.log('[trystero-client] Peer left:', peerId);
      if (this.getPeerCount() > 0) {
        return;
      }
      this.handleNoPeersDetected('Peer left');
    };
    if (this.room.getPeers) {
      const existingPeerCount = this.getPeerCount();
      console.log('[trystero-client] Existing peers:', this.room.getPeers());
      if (existingPeerCount > 0) {
        this.handlePeersAvailable('existing peers');
      }
    } else console.log('[trystero-client] No getPeers event found');
    this.room.onPeerStream = (stream: MediaStream, peerId: string) => {
      console.log('[trystero-client] Peer stream:', peerId, stream);
    };
    if (this.room.onSignalingReady) {
      this.room.onSignalingReady(() => {
        console.log('[trystero-client] Signaling ready');
      });
    }
  }

  private startPeerMonitoring(): void {
    // Peer lifecycle is tracked via onPeerJoin and onPeerLeave callbacks in setupRoomHandlers.
  }

  private stopPeerMonitoring(): void {
    // Nothing to tear down — no polling interval.
  }

  private handlePeersAvailable(reason: string): void {
    this.clearReconnectTimer();
    this.clearControllerConnectionLostTimer();
    controllerConnectionLost.value = false;
    this.hasConnectedPeer = true;
    this.peerConnected = true;
    this.tryOpenConnection(reason);
  }

  private handleNoPeersDetected(reason: string): void {
    if (!this.hasConnectedPeer) {
      return;
    }

    this.peerConnected = false;
    this.emit('disconnected', {
      code: 1000,
      reason,
      wasClean: true
    });
    this.rejectAllPendingRequests(new Error('Peer disconnected'));
    this.state.value = 'disconnected';

    this.scheduleControllerConnectionLostAlert();
  }

  private scheduleControllerConnectionLostAlert(): void {
    if (this.controllerConnectionLostTimer || controllerConnectionLost.value) {
      return;
    }

    this.controllerConnectionLostTimer = setTimeout(() => {
      this.controllerConnectionLostTimer = null;

      if (this.getPeerCount() === 0 && this.hasConnectedPeer && !this.isIntentionalClose) {
        controllerConnectionLost.value = true;
      }
    }, CONTROLLER_CONNECTION_LOST_DELAY_MS);
  }

  private clearControllerConnectionLostTimer(): void {
    if (this.controllerConnectionLostTimer) {
      clearTimeout(this.controllerConnectionLostTimer);
      this.controllerConnectionLostTimer = null;
    }
  }

  private async setupRpcAction(): Promise<void> {
    // Create an action for RPC communication
    if (!this.room) {
      throw new Error('No Trystero room available');
    }

    try {
      const action = this.room.makeAction(ACTION_NAME);
      console.log(
        '[trystero] makeAction result:',
        typeof action,
        Array.isArray(action) ? `[${action.length} elements]` : action
      );

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
        }
      } catch (e) {
        console.log('[trystero] Error leaving room', e);
      }
      this.room = null;
    }

    this.sendAction = null;
    this.receiveAction = null;
    this.peerConnected = false;
    this.clearControllerConnectionLostTimer();
    console.log('[trystero] Transport disconnected');
  }

  protected prepareReconnect(): void {
    this.stopPeerMonitoring();
    this.clearControllerConnectionLostTimer();
    this.disconnectTransport();
    super.prepareReconnect();
  }

  protected send(message: string): void {
    if (!this.sendAction) {
      console.error('[trystero-client] Cannot send - no sendAction available');
      throw new Error('Not connected to peer');
    }

    if (!this.peerConnected) {
      console.error('[trystero] Cannot send - no peer connected');
      throw new Error('No peer connected');
    }

    console.log('[trystero-client] Sending message:', message);
    this.sendAction(message);
  }

  protected isTransportConnected(): boolean {
    console.log('isTransportConnected', this.peerConnected);
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

  protected handleResponse(response: IJsonRpcResponse): void {
    console.log('[trystero-client] JSON-RPC response:', response);
    super.handleResponse(response);
  }

  protected handleTransportClose(code: number, reason: string, wasClean: boolean): void {
    if (this.config.debug) {
      console.log('[trystero] closed:', code, reason);
    }

    this.peerConnected = false;

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
    const prevReconnectAttempts = this.reconnectAttempts;
    this.reconnectAttempts = 0;

    console.log('[trystero] connected');

    // Emit connected event
    const event: IConnectedEvent = {
      timestamp: Date.now(),
      reconnectAttempt: wasReconnect ? prevReconnectAttempts : 0
    };

    this.emit('connected', event);

    if (wasReconnect) {
      this.emit('reconnected', event);
    }
  }

  private async checkRelayHealth(): Promise<Record<string, boolean>> {
    const relayStatus: Record<string, boolean> = {};

    for (const relayUrl of this.config.relayUrls || []) {
      try {
        const ws = new WebSocket(relayUrl);
        await new Promise<void>((resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout>;
          ws.onopen = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          ws.onerror = () => {
            clearTimeout(timeoutId);
            ws.close();
            reject(new Error('relay error'));
          };
          timeoutId = setTimeout(() => {
            resolve();
          }, 3000);
        });
        ws.close();
        relayStatus[relayUrl] = true;
        console.log(`[trystero] Relay ${relayUrl}: OK`);
      } catch {
        relayStatus[relayUrl] = false;
        console.error(`[trystero] Relay ${relayUrl}: FAILED`);
      }
    }

    return relayStatus;
  }

  private getPeerCount(): number {
    if (!this.room?.getPeers) {
      return 0;
    }

    const peers = this.room.getPeers();
    if (Array.isArray(peers)) {
      return peers.length;
    }

    if (peers && typeof peers === 'object') {
      return Object.keys(peers).length;
    }

    return 0;
  }

  private tryOpenConnection(reason: string): void {
    const peerCount = this.getPeerCount();
    const hasTransport = this.sendAction !== null;

    console.log('[trystero-client] tryOpenConnection', {
      reason,
      peerConnected: this.peerConnected,
      peerCount,
      hasTransport,
      state: this.state.value
    });

    if (!this.peerConnected || peerCount === 0 || !hasTransport) {
      return;
    }

    this.handleOpen();
  }

  private async logDerivedTopics(roomId: string): Promise<void> {
    const rootTopicPlaintext = `Trystero@${APP_ID}@${roomId}`;
    const rootTopicHash = await this.hashTopic(rootTopicPlaintext, 'SHA-1');
    const roomNamespace = await this.hashTopic(rootTopicPlaintext, 'SHA-256', 'hex');

    console.log('[trystero-client] Derived topics:', {
      rootTopicPlaintext,
      rootTopicHash,
      roomNamespace
    });
  }

  private async hashTopic(
    input: string,
    algorithm: 'SHA-1' | 'SHA-256',
    format: 'base36' | 'hex' = 'base36'
  ): Promise<string> {
    const buffer = new Uint8Array(
      await crypto.subtle.digest(algorithm, new TextEncoder().encode(input))
    );

    if (format === 'hex') {
      return Array.from(buffer)
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
    }

    return Array.from(buffer)
      .map((value) => value.toString(36))
      .join('');
  }

  private installRelaySocketDebugging(): void {
    if (
      relaySocketDebugInstalled ||
      typeof window === 'undefined' ||
      typeof window.WebSocket === 'undefined'
    ) {
      return;
    }

    const relayUrls = new Set(this.config.relayUrls || []);
    const NativeWebSocket = window.WebSocket;

    class DebugWebSocket extends NativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);

        const normalizedUrl = typeof url === 'string' ? url : url.toString();
        if (!relayUrls.has(normalizedUrl)) {
          return;
        }

        console.log('[trystero-client] Relay socket created:', normalizedUrl);

        this.addEventListener('open', () => {
          console.log('[trystero-client] Relay socket open:', normalizedUrl);
        });

        this.addEventListener('close', (event) => {
          console.log('[trystero-client] Relay socket close:', normalizedUrl, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
        });

        this.addEventListener('error', () => {
          console.log('[trystero-client] Relay socket error:', normalizedUrl);
        });

        // this.addEventListener('message', (event) => {
        //   console.log(
        //     '[trystero-client] Relay socket message:',
        //     normalizedUrl,
        //     String(event.data).slice(0, 300)
        //   );
        // });
      }

      override send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const url = this.url;
        if (relayUrls.has(url)) {
          console.log('[trystero-client] Relay socket send:', url, String(data).slice(0, 300));
        }

        super.send(data);
      }
    }

    window.WebSocket = DebugWebSocket as typeof WebSocket;
    relaySocketDebugInstalled = true;
    console.log('[trystero-client] Relay socket debugging installed');
  }

  private installWebRtcDebugging(): void {
    if (
      webRtcDebugInstalled ||
      typeof window === 'undefined' ||
      typeof window.RTCPeerConnection === 'undefined'
    ) {
      return;
    }

    const NativePeerConnection = window.RTCPeerConnection;

    class DebugPeerConnection extends NativePeerConnection {
      constructor(configuration?: RTCConfiguration) {
        console.log('[trystero-client] RTCPeerConnection created:', {
          ...configuration,
          iceServers: configuration?.iceServers?.map((server) => ({
            urls: server.urls,
            username: server.username ? '[set]' : undefined,
            credential: server.credential ? '[set]' : undefined
          }))
        });
        super(configuration);

        this.addEventListener('connectionstatechange', () => {
          console.log('[trystero-client] RTCPeerConnection connectionState:', this.connectionState);
        });

        this.addEventListener('iceconnectionstatechange', () => {
          console.log(
            '[trystero-client] RTCPeerConnection iceConnectionState:',
            this.iceConnectionState
          );
        });

        this.addEventListener('icegatheringstatechange', () => {
          console.log(
            '[trystero-client] RTCPeerConnection iceGatheringState:',
            this.iceGatheringState
          );
        });

        this.addEventListener('signalingstatechange', () => {
          console.log('[trystero-client] RTCPeerConnection signalingState:', this.signalingState);
        });

        this.addEventListener('icecandidateerror', (event) => {
          console.error('[trystero-client] RTCPeerConnection icecandidateerror:', event);
        });

        this.addEventListener('icecandidate', (event) => {
          console.log(
            '[trystero-client] RTCPeerConnection icecandidate:',
            event.candidate?.candidate ?? null
          );
        });
      }

      createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel {
        console.log('[trystero-client] createDataChannel:', label, dataChannelDict);
        const channel = super.createDataChannel(label, dataChannelDict);
        channel.addEventListener('open', () => {
          console.log('[trystero-client] datachannel open:', label);
        });
        channel.addEventListener('close', () => {
          console.log('[trystero-client] datachannel close:', label);
        });
        channel.addEventListener('error', (event) => {
          console.error('[trystero-client] datachannel error:', label, event);
        });
        return channel;
      }

      createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
      createOffer(
        successCallback: RTCSessionDescriptionCallback,
        failureCallback: RTCPeerConnectionErrorCallback,
        options?: RTCOfferOptions
      ): Promise<void>;
      async createOffer(
        optionsOrSuccessCallback?: RTCOfferOptions | RTCSessionDescriptionCallback,
        failureCallback?: RTCPeerConnectionErrorCallback,
        options?: RTCOfferOptions
      ): Promise<RTCSessionDescriptionInit | void> {
        if (typeof optionsOrSuccessCallback === 'function') {
          console.log('[trystero-client] createOffer called with callbacks:', options);
          return super.createOffer(
            optionsOrSuccessCallback as RTCSessionDescriptionCallback,
            failureCallback!,
            options
          );
        }

        console.log('[trystero-client] createOffer called:', optionsOrSuccessCallback);
        try {
          const offer = await super.createOffer(optionsOrSuccessCallback);
          console.log('[trystero-client] createOffer resolved:', {
            type: offer.type,
            sdpLength: offer.sdp?.length ?? 0
          });
          return offer;
        } catch (error) {
          console.error('[trystero-client] createOffer failed:', error);
          throw error;
        }
      }

      createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
      createAnswer(
        successCallback: RTCSessionDescriptionCallback,
        failureCallback: RTCPeerConnectionErrorCallback
      ): Promise<void>;
      async createAnswer(
        optionsOrSuccessCallback?: RTCAnswerOptions | RTCSessionDescriptionCallback,
        failureCallback?: RTCPeerConnectionErrorCallback
      ): Promise<RTCSessionDescriptionInit | void> {
        if (typeof optionsOrSuccessCallback === 'function') {
          console.log('[trystero-client] createAnswer called with callbacks');
          return super.createAnswer(
            optionsOrSuccessCallback as RTCSessionDescriptionCallback,
            failureCallback!
          );
        }

        console.log('[trystero-client] createAnswer called:', optionsOrSuccessCallback);
        try {
          const answer = await super.createAnswer(optionsOrSuccessCallback);
          console.log('[trystero-client] createAnswer resolved:', {
            type: answer.type,
            sdpLength: answer.sdp?.length ?? 0
          });
          return answer;
        } catch (error) {
          console.error('[trystero-client] createAnswer failed:', error);
          throw error;
        }
      }

      async setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
        console.log('[trystero-client] setLocalDescription called:', {
          type: description?.type,
          sdpLength: description?.sdp?.length ?? 0
        });
        try {
          await super.setLocalDescription(description);
          console.log('[trystero-client] setLocalDescription resolved:', {
            type: this.localDescription?.type,
            sdpLength: this.localDescription?.sdp?.length ?? 0
          });
        } catch (error) {
          console.error('[trystero-client] setLocalDescription failed:', error);
          throw error;
        }
      }

      async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
        console.log('[trystero-client] setRemoteDescription called:', {
          type: description.type,
          sdpLength: description.sdp?.length ?? 0
        });
        try {
          await super.setRemoteDescription(description);
          console.log('[trystero-client] setRemoteDescription resolved:', {
            type: this.remoteDescription?.type,
            sdpLength: this.remoteDescription?.sdp?.length ?? 0
          });
        } catch (error) {
          console.error('[trystero-client] setRemoteDescription failed:', error);
          throw error;
        }
      }

      addIceCandidate(candidate?: RTCIceCandidateInit | null): Promise<void>;
      addIceCandidate(
        candidate: RTCIceCandidateInit | null,
        successCallback: VoidFunction,
        failureCallback: RTCPeerConnectionErrorCallback
      ): Promise<void>;
      async addIceCandidate(
        candidate?: RTCIceCandidateInit | null,
        successCallback?: VoidFunction,
        failureCallback?: RTCPeerConnectionErrorCallback
      ): Promise<void> {
        console.log('[trystero-client] addIceCandidate called:', candidate?.candidate ?? null);
        try {
          if (successCallback && failureCallback) {
            await super.addIceCandidate(candidate ?? null, successCallback, failureCallback);
          } else {
            await super.addIceCandidate(candidate);
          }
          console.log('[trystero-client] addIceCandidate resolved');
        } catch (error) {
          console.error('[trystero-client] addIceCandidate failed:', error);
          throw error;
        }
      }
    }

    window.RTCPeerConnection = DebugPeerConnection;
    webRtcDebugInstalled = true;
    console.log('[trystero-client] WebRTC debugging installed');
  }
}
