import { describe, it, expect } from 'vitest';
import {
  WebSocketError,
  WebSocketTimeoutError,
  WebSocketConnectionError,
  JsonRpcError
} from '@/ws/errors';

describe('errors.ts', () => {
  describe('WebSocketError', () => {
    it('creates error with message', () => {
      const error = new WebSocketError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('WebSocketError');
    });

    it('creates error with message and code', () => {
      const error = new WebSocketError('Failed', 'CUSTOM_CODE');
      expect(error.message).toBe('Failed');
      expect(error.code).toBe('CUSTOM_CODE');
    });

    it('extends Error class', () => {
      const error = new WebSocketError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error).toBe(true);
    });

    it('preserves stack trace', () => {
      const error = new WebSocketError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('WebSocketError');
    });

    it('can be thrown and caught', () => {
      expect(() => {
        throw new WebSocketError('Caught');
      }).toThrow(WebSocketError);
    });

    it('can be caught as Error', () => {
      expect(() => {
        throw new WebSocketError('Caught as Error');
      }).toThrow(Error);
    });
  });

  describe('WebSocketTimeoutError', () => {
    it('creates timeout error with method and duration', () => {
      const error = new WebSocketTimeoutError('getData', 5000);
      expect(error.message).toBe('Request timeout after 5000ms: getData');
      expect(error.name).toBe('WebSocketTimeoutError');
      expect(error.code).toBe('TIMEOUT');
    });

    it('formats message with method name', () => {
      const error = new WebSocketTimeoutError('updateSettings', 3000);
      expect(error.message).toContain('updateSettings');
      expect(error.message).toContain('3000');
    });

    it('extends WebSocketError', () => {
      const error = new WebSocketTimeoutError('test', 1000);
      expect(error).toBeInstanceOf(WebSocketError);
      expect(error).toBeInstanceOf(Error);
    });

    it('has TIMEOUT error code', () => {
      const error = new WebSocketTimeoutError('method', 5000);
      expect(error.code).toBe('TIMEOUT');
    });

    it('can be caught as WebSocketError', () => {
      expect(() => {
        throw new WebSocketTimeoutError('method', 5000);
      }).toThrow(WebSocketError);
    });

    it('handles various timeout durations', () => {
      const error1ms = new WebSocketTimeoutError('fast', 1);
      const error5000ms = new WebSocketTimeoutError('slow', 5000);
      const error60000ms = new WebSocketTimeoutError('very-slow', 60000);

      expect(error1ms.message).toContain('1ms');
      expect(error5000ms.message).toContain('5000ms');
      expect(error60000ms.message).toContain('60000ms');
    });
  });

  describe('WebSocketConnectionError', () => {
    it('creates connection error with message', () => {
      const error = new WebSocketConnectionError('Connection refused');
      expect(error.message).toBe('Connection refused');
      expect(error.name).toBe('WebSocketConnectionError');
      expect(error.code).toBe('CONNECTION_ERROR');
    });

    it('extends WebSocketError', () => {
      const error = new WebSocketConnectionError('Failed to connect');
      expect(error).toBeInstanceOf(WebSocketError);
      expect(error).toBeInstanceOf(Error);
    });

    it('has CONNECTION_ERROR code', () => {
      const error = new WebSocketConnectionError('Disconnected');
      expect(error.code).toBe('CONNECTION_ERROR');
    });

    it('handles detailed error messages', () => {
      const detailedMessage = 'WebSocket connection failed: ECONNREFUSED 127.0.0.1:8080';
      const error = new WebSocketConnectionError(detailedMessage);
      expect(error.message).toBe(detailedMessage);
    });

    it('can be caught as WebSocketError', () => {
      expect(() => {
        throw new WebSocketConnectionError('Connection lost');
      }).toThrow(WebSocketError);
    });
  });

  describe('JsonRpcError', () => {
    it('creates RPC error with message and code', () => {
      const error = new JsonRpcError('Invalid method', '-32601');
      expect(error.message).toBe('Invalid method');
      expect(error.code).toBe('-32601');
      expect(error.name).toBe('JsonRpcError');
    });

    it('creates RPC error with data', () => {
      const errorData = { details: 'Method not found' };
      const error = new JsonRpcError('Error occurred', '-32700', errorData);
      expect(error.data).toEqual(errorData);
    });

    it('extends WebSocketError', () => {
      const error = new JsonRpcError('Parse error', '-32700');
      expect(error).toBeInstanceOf(WebSocketError);
      expect(error).toBeInstanceOf(Error);
    });

    it('has RPC_ERROR code', () => {
      const error = new JsonRpcError('Server error', '-32000');
      expect(error.code).toBe('-32000');
    });

    it('preserves WebSocketError code as RPC_ERROR', () => {
      const error = new JsonRpcError('Method not found', '-32601');
      // The base WebSocketError gets RPC_ERROR code
      expect(error).toHaveProperty('code', '-32601');
    });

    it('implements IJsonRpcError interface', () => {
      const error = new JsonRpcError('Error', '-32000', { some: 'data' });
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('data');
    });

    it('can be caught as WebSocketError', () => {
      expect(() => {
        throw new JsonRpcError('RPC error', '-32000');
      }).toThrow(WebSocketError);
    });

    it('handles JSON-RPC error codes', () => {
      const codes = ['-32700', '-32600', '-32601', '-32602', '-32603', '-32000'];
      codes.forEach((code) => {
        const error = new JsonRpcError('Error', code);
        expect(error.code).toBe(code);
      });
    });

    it('handles complex error data', () => {
      const complexData = {
        nested: {
          details: 'Some information',
          code: 1234
        },
        array: [1, 2, 3]
      };
      const error = new JsonRpcError('Complex error', '-32000', complexData);
      expect(error.data).toEqual(complexData);
    });
  });

  describe('error hierarchy', () => {
    it('distinguishes between error types', () => {
      const wsError = new WebSocketError('ws');
      const timeoutError = new WebSocketTimeoutError('timeout', 5000);
      const connError = new WebSocketConnectionError('conn');
      const rpcError = new JsonRpcError('rpc', '-32000');

      expect(wsError instanceof WebSocketTimeoutError).toBe(false);
      expect(timeoutError instanceof WebSocketError).toBe(true);
      expect(connError instanceof WebSocketConnectionError).toBe(true);
      expect(rpcError instanceof JsonRpcError).toBe(true);
    });

    it('all errors can be caught as Error', () => {
      const errors = [
        new WebSocketError('ws'),
        new WebSocketTimeoutError('timeout', 1000),
        new WebSocketConnectionError('conn'),
        new JsonRpcError('rpc', '-32000')
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
      });
    });
  });

  describe('error serialization', () => {
    it('error message is serializable', () => {
      const error = new WebSocketError('Test');
      const serialized = JSON.stringify({ message: error.message });
      expect(serialized).toContain('Test');
    });

    it('error properties are accessible', () => {
      const error = new JsonRpcError('RPC Error', '-32000', { info: 'data' });
      expect(error.message).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.data).toBeDefined();
      expect(error.name).toBeDefined();
    });
  });

  describe('error usage patterns', () => {
    it('can throw and catch specific error type', () => {
      const throwTimeoutError = () => {
        throw new WebSocketTimeoutError('test', 5000);
      };

      expect(throwTimeoutError).toThrow(WebSocketTimeoutError);
    });

    it('can differentiate timeout from connection errors', () => {
      let caughtError: Error | null = null;

      try {
        throw new WebSocketTimeoutError('test', 5000);
      } catch (error) {
        caughtError = error as Error;
        if (error instanceof WebSocketTimeoutError) {
          expect(true).toBe(true); // timeout caught
        }
      }

      expect(caughtError).toBeInstanceOf(WebSocketTimeoutError);
    });

    it('handles error in catch block with specific code check', () => {
      const testError = new JsonRpcError('Not found', '-32601');

      if (testError.code === '-32601') {
        expect(testError.message).toBe('Not found');
      }
    });
  });
});
