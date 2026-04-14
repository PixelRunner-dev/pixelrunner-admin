import type { IJsonRpcError } from 'pixelrunner-shared';

export class WebSocketError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export class WebSocketTimeoutError extends WebSocketError {
  constructor(method: string, timeout: number) {
    super(`Request timeout after ${timeout}ms: ${method}`, 'TIMEOUT');
    this.name = 'WebSocketTimeoutError';
  }
}

export class WebSocketConnectionError extends WebSocketError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'WebSocketConnectionError';
  }
}

export class JsonRpcError extends WebSocketError implements IJsonRpcError {
  constructor(
    message: string,
    public code: string,
    public data?: unknown
  ) {
    super(message, 'RPC_ERROR');
    this.name = 'JsonRpcError';
  }
}
