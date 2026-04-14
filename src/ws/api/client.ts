/**
 * Generic client interface for RPC communication.
 *
 * This interface defines the contract for making JSON-RPC requests over
 * any transport (WebSocket, Trystero/WebRTC, etc.). Both WebSocketClient
 * and TrysteroWebRTCClient implement this interface, allowing API classes
 * to work with either transport without knowing the implementation details.
 */

import type { Ref, ComputedRef } from 'vue';
import type {
  IJsonRpcParams,
  IRequestOptions,
  IConnectionState,
  IWebSocketEventType,
  IEventHandler
} from 'pixelrunner-shared;

/**
 * Generic RPC client interface.
 *
 * This interface provides the minimum functionality needed by API classes
 * to communicate with the device. It abstracts away the underlying transport.
 */
export interface IRpcClient {
  /**
   * Current connection state
   */
  readonly state: Ref<IConnectionState>;

  /**
   * Whether the client is currently connected
   */
  readonly isConnected: ComputedRef<boolean>;

  /**
   * Whether the client is currently connecting
   */
  readonly isConnecting: ComputedRef<boolean>;

  /**
   * Last error that occurred, if any
   */
  readonly lastError: Ref<Error | null>;

  /**
   * Make a JSON-RPC request to the device.
   * @param method - The RPC method name
   * @param params - Optional method parameters
   * @param options - Optional request options (timeout, abort signal, etc.)
   * @returns Promise resolving to the response result
   */
  request<T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions
  ): Promise<T>;

  /**
   * Subscribe to events.
   * @param event - Event name to subscribe to
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): () => void;

  /**
   * Unsubscribe from events.
   */
  off<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void;

  /**
   * Subscribe to an event once.
   */
  once<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void;

  /**
   * Connect to the server/device.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the server/device.
   */
  disconnect(): void;

  /**
   * Reconnect to the server/device.
   */
  reconnect(): Promise<void>;
}

/**
 * Type guard to check if an object implements IRpcClient.
 * @param obj - Object to check
 * @returns True if the object has the required client properties
 */
export function isRpcClient(obj: unknown): obj is IRpcClient {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const client = obj as Partial<IRpcClient>;
  return (
    client.request !== undefined &&
    client.connect !== undefined &&
    client.disconnect !== undefined &&
    client.state !== undefined &&
    client.isConnected !== undefined
  );
}

/**
 * Factory function to create API instances from a client.
 * This allows API classes to be instantiated dynamically.
 */
export interface ApiFactory<TClient extends IRpcClient> {
  new (client: TClient): unknown;
}

/**
 * Base class for API classes that work with any IRpcClient implementation.
 * This provides a common foundation for all API classes.
 */
export abstract class ApiClientBase<TClient extends IRpcClient> {
  protected readonly client: TClient;

  constructor(client: TClient) {
    this.client = client;
  }

  /**
   * Make an RPC request through the client.
   * @protected
   */
  protected request<T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions
  ): Promise<T> {
    return this.client.request<T>(method, params, options);
  }

  /**
   * Subscribe to an event.
   * @protected
   */
  protected on<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): () => void {
    return this.client.on(event, handler);
  }

  /**
   * Check if the client is connected.
   * @protected
   */
  protected get connected(): boolean {
    return this.client.isConnected.value;
  }
}
