import { ref, computed, type Ref, type ComputedRef } from 'vue';
import {
  DEFAULT_RECONNECT_MAX_INTERVAL,
  DEFAULT_TIMEOUT,
  DEFAULT_WEBSOCKET_CONFIG,
  DEFAULT_RECONNECT_INTERVAL
} from '../constants.ts';
import { WebSocketConnectionError, WebSocketTimeoutError, JsonRpcError } from './errors.ts';

import type {
  IJsonRpcRequest,
  IJsonRpcResponse,
  IJsonRpcNotification,
  IJsonRpcMessage,
  IJsonRpcParams,
  IWebSocketEventType,
  IWebSocketConfig,
  IConnectionState,
  IRequestOptions,
  IPendingRequest,
  IEventHandler,
  IConnectedEvent,
  IDisconnectedEvent,
  IReconnectingEvent,
  INotificationEvent
} from 'pixelrunner-shared';

/**
 * Abstract base class for WebSocket-like clients.
 * Contains all shared logic between WebSocketClient and TrysteroWebRTCClient.
 * @param T - The configuration type (must extend IWebSocketConfig)
 */
export abstract class BaseWebSocketClient<TConfig extends IWebSocketConfig = IWebSocketConfig> {
  // ============================================================================
  // Public Reactive Properties
  // ============================================================================

  public readonly state: Ref<IConnectionState>;
  public readonly isConnected: ComputedRef<boolean>;
  public readonly isConnecting: ComputedRef<boolean>;
  public readonly lastError: Ref<Error | null>;

  // ============================================================================
  // Protected Properties
  // ============================================================================

  protected config: Required<TConfig>;
  protected requestId: number = 0;
  protected pendingRequests: Map<number, IPendingRequest> = new Map();
  protected eventHandlers: Map<IWebSocketEventType, Set<IEventHandler<IWebSocketEventType>>> =
    new Map();
  protected reconnectAttempts: number = 0;
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected isIntentionalClose: boolean = false;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(config?: TConfig) {
    this.config = { ...DEFAULT_WEBSOCKET_CONFIG, ...config } as Required<TConfig>;

    // Initialize reactive state
    this.state = ref<IConnectionState>('disconnected');
    this.lastError = ref<Error | null>(null);

    this.isConnected = computed(() => this.state.value === 'connected');
    this.isConnecting = computed(
      () => this.state.value === 'connecting' || this.state.value === 'reconnecting'
    );
  }

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  /**
   * Establish the connection. Must set state to 'connected' when successful.
   */
  public abstract connect(): Promise<void>;

  /**
   * Close the connection and clean up resources.
   */
  public abstract disconnect(): void;

  /**
   * Send a raw message through the underlying transport.
   * @param message - The message string to send
   */
  protected abstract send(message: string): void;

  /**
   * Check if the underlying transport is connected.
   */
  protected abstract isTransportConnected(): boolean;

  /**
   * Handle transport-specific errors.
   * @param error - The error event from the transport
   */
  protected abstract handleTransportError(error: unknown): void;

  /**
   * Handle incoming messages from the transport.
   * @param data - The message data from the transport (string or Blob)
   */
  protected abstract handleTransportMessage(data: unknown): void;

  /**
   * Handle transport close event.
   * @param code - Close code
   * @param reason - Close reason
   * @param wasClean - Whether the close was clean
   */
  protected abstract handleTransportClose(code: number, reason: string, wasClean: boolean): void;

  // ============================================================================
  // Public Connection Management Methods
  // ============================================================================

  public async reconnect(): Promise<void> {
    this.disconnect();
    this.reconnectAttempts = 0;
    return this.connect();
  }

  // ============================================================================
  // Public Request/Response API
  // ============================================================================

  public request<T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if connected
      if (!this.isTransportConnected()) {
        reject(new WebSocketConnectionError('WebSocket is not connected'));
        return;
      }

      // Generate unique request ID
      const id = this.generateRequestId();

      // Create JSON-RPC request
      const request: IJsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        ...(params !== undefined && { params })
      };

      // Setup timeout
      const timeout = options?.timeout ?? this.getConfigNumber('timeout', DEFAULT_TIMEOUT);
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new WebSocketTimeoutError(method, timeout));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
        method,
        timestamp: Date.now()
      });

      // Handle AbortSignal if provided
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(id);
            reject(new Error('Request aborted'));
          }
        });
      }

      try {
        // Send request
        const message = JSON.stringify(request);
        this.send(message);

        if (this.config.debug) {
          console.log('[ws] sent:', request);
        }
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  // ============================================================================
  // Public Event System Methods
  // ============================================================================

  public on<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set<IEventHandler<IWebSocketEventType>>());
    }

    this.eventHandlers.get(event)!.add(handler as IEventHandler<IWebSocketEventType>);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  public off<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as IEventHandler<IWebSocketEventType>);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  public once<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void {
    const onceHandler: IEventHandler<K> = ((data: unknown) => {
      // Type assertion through unknown to any to bypass complex type inference
      // The handler is already typed as IEventHandler<K>, so it will receive the correct type at runtime
      (handler as (data: unknown) => void)(data);
      this.off(event, onceHandler);
    }) as IEventHandler<K>;

    this.on(event, onceHandler);
  }

  // ============================================================================
  // Protected Event Handlers (called by subclasses)
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

  protected handleClose(code: number, reason: string, wasClean: boolean): void {
    const wasConnected = this.state.value === 'connected';

    if (this.config.debug) {
      console.log('[ws] closed:', code, reason);
    }

    // Emit disconnected event
    const disconnectedEvent: IDisconnectedEvent = {
      code,
      reason,
      wasClean
    };

    this.emit('disconnected', disconnectedEvent);

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new WebSocketConnectionError('WebSocket closed'));
    });
    this.pendingRequests.clear();

    // Attempt reconnection if enabled and not intentionally closed
    if (
      !this.isIntentionalClose &&
      this.config.reconnect &&
      wasConnected &&
      this.reconnectAttempts < this.getConfigNumber('maxReconnectAttempts', Infinity)
    ) {
      this.scheduleReconnect();
    } else {
      this.state.value = 'disconnected';
    }
  }

  protected handleMessage(data: Blob | string): void {
    try {
      const message = this.parseMessage(data);

      if (!message) {
        return;
      }

      if (this.config.debug) {
        console.log('[ws] received:', message);
      }

      // Check if it's a response (has id) or notification (no id)
      if ('id' in message) {
        this.handleResponse(message as IJsonRpcResponse);
      } else {
        this.handleNotification(message as IJsonRpcNotification);
      }
    } catch (error) {
      console.error('[ws] message parse error:', error);
    }
  }

  // ============================================================================
  // Protected Message Handling Methods
  // ============================================================================

  protected parseMessage(data: Blob | string): IJsonRpcMessage | null {
    try {
      let text: string;

      if (data instanceof Blob) {
        // Synchronous conversion not possible - return null for sync parsing
        // Subclasses can override to handle async Blob reading
        return null;
      } else {
        text = data;
      }

      return JSON.parse(text) as IJsonRpcMessage;
    } catch (error) {
      console.error('[ws] failed to parse message:', error);
      return null;
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
    const methodEvent: IWebSocketEventType = `message:${notification.method}`;
    this.emit(methodEvent, notification.params);
  }

  // ============================================================================
  // Private Utility Methods
  // ============================================================================

  private generateRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  protected scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    this.state.value = 'reconnecting';

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.getConfigNumber('reconnectInterval', DEFAULT_RECONNECT_INTERVAL) *
        Math.pow(this.getConfigNumber('reconnectDecay', 1.5), this.reconnectAttempts - 1),
      this.getConfigNumber('reconnectMaxInterval', DEFAULT_RECONNECT_MAX_INTERVAL)
    );

    if (this.config.debug) {
      console.log(
        `[ws] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.getConfigNumber('maxReconnectAttempts', Infinity)})`
      );
    }

    // Emit reconnecting event
    const reconnectingEvent: IReconnectingEvent = {
      attempt: this.reconnectAttempts,
      maxAttempts: this.getConfigNumber('maxReconnectAttempts', Infinity),
      nextDelay: delay
    };

    this.emit('reconnecting', reconnectingEvent);

    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        if (this.config.debug) {
          console.error('[ws] reconnection failed:', error);
        }
      });
    }, delay);
  }

  protected clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  protected rejectAllPendingRequests(error: Error): void {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(error);
    });
    this.pendingRequests.clear();
  }

  /**
   * Helper to get config value with guaranteed number type
   */
  protected getConfigNumber(key: keyof IWebSocketConfig, defaultValue: number): number {
    const value = this.config[key];
    return typeof value === 'number' ? value : defaultValue;
  }

  /**
   * Helper to get config value with guaranteed boolean type
   */
  protected getConfigBoolean(key: keyof IWebSocketConfig, defaultValue: boolean): boolean {
    const value = this.config[key];
    return typeof value === 'boolean' ? value : defaultValue;
  }

  protected emit<K extends IWebSocketEventType>(event: K, data: unknown): void {
    const handlers = this.eventHandlers.get(event);

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          // Type assertion through unknown to any to bypass complex type inference
          // The handler is already typed as EventHandler<K>, so it will receive the correct type at runtime
          (handler as (data: unknown) => void)(data);
        } catch (error) {
          console.error(`[ws] event handler error (${event}):`, error);
        }
      });
    }
  }
}
