/**
 * Shared RPC message handling utilities.
 * Used by both WebSocket and Trystero clients for parsing JSON-RPC messages.
 */

import type { IJsonRpcMessage } from 'pixelrunner-shared;

/**
 * Parses a JSON-RPC message from a string.
 * @param data - The raw string data received from the transport
 * @returns The parsed JSON-RPC message or null if parsing fails
 */
export function parseJsonRpcMessage(data: string): IJsonRpcMessage | null {
  try {
    const message = JSON.parse(data);
    // Validate basic JSON-RPC structure
    if (
      message &&
      typeof message === 'object' &&
      (message.jsonrpc === '2.0' || message.jsonrpc === '2.0')
    ) {
      return message as IJsonRpcMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a JSON-RPC message is a request (has an id).
 * @param message - The parsed JSON-RPC message
 * @returns True if the message is a request
 */
export function isJsonRpcRequest(message: IJsonRpcMessage): boolean {
  return 'id' in message && typeof message.id === 'number';
}

/**
 * Checks if a JSON-RPC message is a response (has an id and result/error).
 * @param message - The parsed JSON-RPC message
 * @returns True if the message is a response
 */
export function isJsonRpcResponse(message: IJsonRpcMessage): boolean {
  return 'id' in message && ('result' in message || 'error' in message);
}

/**
 * Checks if a JSON-RPC message is a notification (no id).
 * @param message - The parsed JSON-RPC message
 * @returns True if the message is a notification
 */
export function isJsonRpcNotification(message: IJsonRpcMessage): boolean {
  return !('id' in message);
}
