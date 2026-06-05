/**
 * Transport mock service for admin-vue unit tests.
 * Provides reusable mocks for WebSocket, RPC, and Trystero behavior.
 */

import type { IJsonRpcResponse, IJsonRpcRequest } from 'pixelrunner-shared';
import { EventEmitter } from 'node:events';

export interface MockTransportOptions {
  delay?: number;
  failureRate?: number;
  disconnectAfterMs?: number;
  responsePayload?: unknown;
}

/**
 * Mock WebSocket for testing connection behavior, reconnects, and data exchange.
 */
export class MockWebSocket extends EventEmitter {
  readyState: number = 0; // CONNECTING
  url: string;
  private connectDelay: number;
  private messageQueue: (string | ArrayBuffer)[] = [];

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string, options: MockTransportOptions = {}) {
    super();
    this.url = url;
    this.connectDelay = options.delay ?? 0;
    this.scheduleOpen();
  }

  private scheduleOpen() {
    if (this.connectDelay > 0) {
      setTimeout(() => this.open(), this.connectDelay);
    } else {
      setImmediate(() => this.open());
    }
  }

  private open() {
    this.readyState = MockWebSocket.OPEN;
    this.emit('open');
  }

  send(data: string | ArrayBuffer) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close', { code, reason });
  }

  simulateMessage(data: string | ArrayBuffer) {
    this.emit('message', { data });
  }

  simulateError(message: string) {
    const error = new Error(message);
    this.emit('error', error);
  }

  simulateDisconnect() {
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close');
  }

  getMessageCount() {
    return this.messageQueue.length;
  }

  clearMessageQueue() {
    this.messageQueue.length = 0;
  }
}

/**
 * Mock RPC client for testing request/response cycles.
 */
export class MockRpcClient extends EventEmitter {
  private requestId: number = 0;
  private responses: Map<number, unknown> = new Map();
  private requests: Array<{ id: number; method: string; params?: unknown }> = [];
  private responseDelay: number;
  private failureRate: number;

  constructor(options: MockTransportOptions = {}) {
    super();
    this.responseDelay = options.delay ?? 0;
    this.failureRate = options.failureRate ?? 0;
  }

  async request(method: string, params?: unknown): Promise<unknown> {
    const id = ++this.requestId;
    this.requests.push({ id, method, params });

    if (this.shouldFail()) {
      throw new Error(`RPC error: ${method} failed`);
    }

    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    return this.responses.get(id) ?? { jsonrpc: '2.0', result: null, id };
  }

  setResponse(id: number, response: unknown) {
    this.responses.set(id, response);
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  getRequests() {
    return [...this.requests];
  }

  getLastRequest() {
    return this.requests[this.requests.length - 1];
  }

  clearRequests() {
    this.requests.length = 0;
  }

  reset() {
    this.requestId = 0;
    this.requests.length = 0;
    this.responses.clear();
  }
}

/**
 * Mock Trystero room for testing peer connections and messaging.
 */
export class MockTrysteroRoom extends EventEmitter {
  private peers: Set<string> = new Set();
  private actionCallbacks: Map<string, (data: string, peerId: string) => void> = new Map();
  private messageDelay: number;

  onPeerJoin: ((peerId: string) => void) | null = null;
  onPeerLeave: ((peerId: string) => void) | null = null;

  constructor(options: MockTransportOptions = {}) {
    super();
    this.messageDelay = options.delay ?? 0;
  }

  getPeers(): string[] {
    return Array.from(this.peers);
  }

  makeAction(
    actionName: string
  ): [
    send: (data: string, peerId?: string) => void,
    receive: (handler: (data: string, peerId: string) => void) => void
  ] {
    const send = (data: string, peerId?: string) => {
      // Mock send action
    };

    const receive = (handler: (data: string, peerId: string) => void) => {
      this.actionCallbacks.set(actionName, handler);
    };

    return [send, receive];
  }

  leave() {
    this.peers.clear();
    this.emit('left');
  }

  simulatePeerJoin(peerId: string) {
    this.peers.add(peerId);
    this.onPeerJoin?.(peerId);
  }

  simulatePeerLeave(peerId: string) {
    this.peers.delete(peerId);
    this.onPeerLeave?.(peerId);
  }

  simulateMessage(actionName: string, data: string, peerId: string) {
    const handler = this.actionCallbacks.get(actionName);
    if (handler) {
      if (this.messageDelay > 0) {
        setTimeout(() => handler(data, peerId), this.messageDelay);
      } else {
        handler(data, peerId);
      }
    }
  }

  simulateError(error: Error) {
    this.emit('error', error);
  }

  reset() {
    this.peers.clear();
    this.actionCallbacks.clear();
    this.onPeerJoin = null;
    this.onPeerLeave = null;
    this.removeAllListeners();
  }
}

/**
 * Factory for creating mock transport instances with consistent configuration.
 */
export class MockTransportFactory {
  private options: MockTransportOptions;

  constructor(options: MockTransportOptions = {}) {
    this.options = options;
  }

  createWebSocket(url: string): MockWebSocket {
    return new MockWebSocket(url, this.options);
  }

  createRpcClient(): MockRpcClient {
    return new MockRpcClient(this.options);
  }

  createTrysteroRoom(): MockTrysteroRoom {
    return new MockTrysteroRoom(this.options);
  }

  setOptions(options: Partial<MockTransportOptions>) {
    this.options = { ...this.options, ...options };
  }

  reset() {
    this.options = {};
  }
}

/**
 * Scenario builders for common testing patterns.
 */
export class TransportScenarios {
  /**
   * Successful connection within given time.
   */
  static successfulConnection(delayMs: number = 0): MockTransportOptions {
    return { delay: delayMs };
  }

  /**
   * Connection with simulated latency.
   */
  static slowConnection(delayMs: number = 500): MockTransportOptions {
    return { delay: delayMs };
  }

  /**
   * Connection with intermittent failures.
   */
  static unreliableConnection(
    failureRate: number = 0.3,
    delayMs: number = 100
  ): MockTransportOptions {
    return { delay: delayMs, failureRate };
  }

  /**
   * Connection that drops after specified time.
   */
  static disconnectAfter(delayMs: number = 5000): MockTransportOptions {
    return { disconnectAfterMs: delayMs };
  }

  /**
   * Immediate failure (no delay, 100% failure rate).
   */
  static immediateFailure(): MockTransportOptions {
    return { delay: 0, failureRate: 1.0 };
  }
}

export const createMockTransport = (options?: MockTransportOptions) =>
  new MockTransportFactory(options);
