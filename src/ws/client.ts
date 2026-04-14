import { WebSocketConnectionError, JsonRpcError } from './errors.ts';

import { BaseWebSocketClient } from './base-client';

import type {
  IJsonRpcResponse,
  IJsonRpcNotification,
  IWebSocketConfig,
  IConnectedEvent,
  IErrorEvent,
  INotificationEvent
} from 'pixelrunner-shared';

/**
 * WebSocketClient provides a WebSocket connection implementation
 * using the native browser WebSocket API.
 */
export class WebSocketClient extends BaseWebSocketClient {
  // Private properties specific to WebSocket
  private ws: WebSocket | null = null;
  private heartbeatTimer: number | null = null;

  constructor(config?: IWebSocketConfig) {
    super(config);
  }

  // ============================================================================
  // Public Abstract Method Implementations
  // ============================================================================

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isIntentionalClose = false;
    this.state.value = 'connecting';
    this.clearReconnectTimer();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        const onOpen = () => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          reject(new WebSocketConnectionError('Failed to connect'));
        };

        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);

        this.ws.onopen = () => this.handleOpen();
        this.ws.onmessage = (event: MessageEvent) => this.handleMessage(event.data);
        this.ws.onclose = (event: CloseEvent) =>
          this.handleTransportClose(event.code, event.reason, event.wasClean);
        this.ws.onerror = (event: Event) => this.handleTransportError(event);
      } catch (error) {
        this.state.value = 'error';
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    // Reject all pending requests
    this.rejectAllPendingRequests(new WebSocketConnectionError('WebSocket disconnected'));

    this.state.value = 'disconnected';
  }

  // ============================================================================
  // Protected Abstract Method Implementations
  // ============================================================================

  protected send(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new WebSocketConnectionError('WebSocket is not connected');
    }
    this.ws.send(message);
  }

  protected isTransportConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  protected handleTransportError(error: unknown): void {
    const err = new WebSocketConnectionError('WebSocket error occurred');
    this.lastError.value = err;

    if (this.config.debug) {
      console.error('[ws] error:', error);
    }

    const errorEvent: IErrorEvent = {
      error: err,
      fatal: this.ws?.readyState === WebSocket.CLOSED
    };

    this.emit('error', errorEvent);
  }

  protected handleTransportMessage(data: unknown): void {
    // data can be string or Blob from WebSocket
    this.handleMessage(data as Blob | string);
  }

  protected handleTransportClose(code: number, reason: string, wasClean: boolean): void {
    if (this.config.debug) {
      console.log('[ws] closed:', code, reason);
    }

    this.stopHeartbeat();

    // Use base class handleClose which handles reconnection logic
    this.handleClose(code, reason, wasClean);
  }

  // ============================================================================
  // Protected Overridden Methods
  // ============================================================================

  protected handleOpen(): void {
    if (this.state.value === 'connected') return;

    this.state.value = 'connected';
    this.lastError.value = null;
    const wasReconnect = this.reconnectAttempts > 0;
    this.reconnectAttempts = 0;

    if (this.config.debug) {
      console.log('[ws] connected');
    }

    // Start heartbeat if configured
    if (this.config.heartbeatInterval > 0) {
      this.startHeartbeat();
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

  protected handleResponse(response: IJsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      if (this.config.debug) {
        console.warn('[ws] received response for unknown request:', response.id);
      }
      return;
    }

    // Clear timeout and remove from pending
    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.id);

    // Handle error response
    if (response.error) {
      const error = new JsonRpcError(
        response.error.message,
        response.error.code,
        response.error.data
      );
      pending.reject(error);
      return;
    }

    // Handle success response
    pending.resolve(response.result);
  }

  protected handleNotification(notification: IJsonRpcNotification): void {
    // Emit generic notification event
    const notificationEvent: INotificationEvent = {
      method: notification.method,
      params: notification.params
    };

    this.emit('notification', notificationEvent);

    // Emit method-specific event
    const methodEvent = `message:${notification.method}` as const;
    this.emit(methodEvent, notification.params);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private startHeartbeat(): void {
    this.stopHeartbeat();

    // Note: Heartbeat implementation depends on server support
    // This is a placeholder for future implementation
    if (this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = window.setInterval(() => {
        // TODO: Implement heartbeat/ping logic when server supports it
        // For now, this is just a placeholder
      }, this.config.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
