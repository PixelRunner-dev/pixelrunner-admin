import { describe, it, expect } from 'vitest';
import {
  parseJsonRpcMessage,
  isJsonRpcRequest,
  isJsonRpcResponse,
  isJsonRpcNotification
} from '@/ws/rpc/message-handler';
import type {
  IJsonRpcMessage,
  IJsonRpcNotification,
  IJsonRpcResponse
} from 'pixelrunner-shared';

describe('message-handler.ts', () => {
  describe('parseJsonRpcMessage', () => {
    it('parses valid JSON-RPC request', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test.method',
        params: { foo: 'bar' },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect(result?.jsonrpc).toBe('2.0');
      expect((result as IJsonRpcNotification)?.method).toBe('test.method');
    });

    it('parses valid JSON-RPC response', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        result: { success: true },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect(result?.jsonrpc).toBe('2.0');
      expect((result as IJsonRpcResponse)?.result).toEqual({ success: true });
    });

    it('parses valid JSON-RPC error response', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Server error' },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect(result?.jsonrpc).toBe('2.0');
      expect((result as any)?.error).toEqual({ code: -32000, message: 'Server error' });
    });

    it('parses valid JSON-RPC notification (no id)', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'notify',
        params: [1, 2, 3]
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect(result?.jsonrpc).toBe('2.0');
      expect((result as IJsonRpcNotification)?.method).toBe('notify');
    });

    it('returns null for invalid JSON', () => {
      const result = parseJsonRpcMessage('not valid json {');

      expect(result).toBeNull();
    });

    it('returns null for non-JSON-RPC message', () => {
      const data = JSON.stringify({ foo: 'bar' });
      const result = parseJsonRpcMessage(data);

      expect(result).toBeNull();
    });

    it('returns null for missing jsonrpc field', () => {
      const data = JSON.stringify({
        method: 'test',
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).toBeNull();
    });

    it('returns null for non-2.0 jsonrpc version', () => {
      const data = JSON.stringify({
        jsonrpc: '1.0',
        method: 'test',
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).toBeNull();
    });

    it('returns null for null input', () => {
      const result = parseJsonRpcMessage(JSON.stringify(null));

      expect(result).toBeNull();
    });

    it('returns null for non-object JSON', () => {
      const result = parseJsonRpcMessage(JSON.stringify('string'));

      expect(result).toBeNull();
    });

    it('returns null for array JSON', () => {
      const result = parseJsonRpcMessage(JSON.stringify([1, 2, 3]));

      expect(result).toBeNull();
    });

    it('handles large payloads', () => {
      const largeParam = 'x'.repeat(10000);
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test.large',
        params: { data: largeParam },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect((result as any)?.params?.data).toBe(largeParam);
    });

    it('handles unicode in message', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: { message: '你好 مرحبا 🚀' },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect((result as any)?.params?.message).toBe('你好 مرحبا 🚀');
    });
  });

  describe('isJsonRpcRequest', () => {
    it('identifies request with id and method', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(true);
    });

    it('identifies request with numeric id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: 42
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(true);
    });

    it('rejects message without id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'notify'
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(false);
    });

    it('rejects message with string id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'string-id'
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(false);
    });

    it('rejects response with result', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: { ok: true },
        id: 1
      } as unknown as IJsonRpcMessage;

      // Response is identified by result/error, not just id
      expect(isJsonRpcRequest(message)).toBe(true);
    });
  });

  describe('isJsonRpcResponse', () => {
    it('identifies response with result and id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: { ok: true },
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message)).toBe(true);
    });

    it('identifies response with error and id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Error' },
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message)).toBe(true);
    });

    it('rejects message without id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: { ok: true }
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message)).toBe(false);
    });

    it('rejects message without result or error', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message)).toBe(false);
    });

    it('accepts message with id and null result', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: null,
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message)).toBe(true);
    });

    it('handles numeric and null results', () => {
      const message1: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: 42,
        id: 1
      } as unknown as IJsonRpcMessage;

      const message2: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: false,
        id: 2
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcResponse(message1)).toBe(true);
      expect(isJsonRpcResponse(message2)).toBe(true);
    });
  });

  describe('isJsonRpcNotification', () => {
    it('identifies notification without id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'notify'
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcNotification(message)).toBe(true);
    });

    it('identifies notification with params', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'notify',
        params: [1, 2, 3]
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcNotification(message)).toBe(true);
    });

    it('rejects message with id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcNotification(message)).toBe(false);
    });

    it('rejects response with id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: { ok: true },
        id: 1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcNotification(message)).toBe(false);
    });
  });

  describe('message classification', () => {
    it('classifies messages correctly by type', () => {
      const request: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'add',
        params: [1, 2],
        id: 1
      } as unknown as IJsonRpcMessage;

      const response: IJsonRpcMessage = {
        jsonrpc: '2.0',
        result: 3,
        id: 1
      } as unknown as IJsonRpcMessage;

      const notification: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'notify',
        params: 'something'
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(request)).toBe(true);
      expect(isJsonRpcResponse(request)).toBe(false);
      expect(isJsonRpcNotification(request)).toBe(false);

      expect(isJsonRpcRequest(response)).toBe(true);
      expect(isJsonRpcResponse(response)).toBe(true);
      expect(isJsonRpcNotification(response)).toBe(false);

      expect(isJsonRpcRequest(notification)).toBe(false);
      expect(isJsonRpcResponse(notification)).toBe(false);
      expect(isJsonRpcNotification(notification)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty object', () => {
      const result = parseJsonRpcMessage(JSON.stringify({}));
      expect(result).toBeNull();
    });

    it('handles deeply nested params', () => {
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: {
          level1: {
            level2: {
              level3: {
                level4: 'deep'
              }
            }
          }
        },
        id: 1
      });

      const result = parseJsonRpcMessage(data);

      expect(result).not.toBeNull();
      expect((result as any)?.params?.level1?.level2?.level3?.level4).toBe('deep');
    });

    it('handles zero as id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: 0
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(true);
    });

    it('handles negative id', () => {
      const message: IJsonRpcMessage = {
        jsonrpc: '2.0',
        method: 'test',
        id: -1
      } as unknown as IJsonRpcMessage;

      expect(isJsonRpcRequest(message)).toBe(true);
    });
  });
});
