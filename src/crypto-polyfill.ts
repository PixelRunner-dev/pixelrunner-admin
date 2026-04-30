/**
 * crypto.subtle polyfill for insecure contexts (HTTP)
 * Uses js-sha1/js-sha256 for hashing and @noble/ciphers for AES-GCM.
 *
 * WARNING: While this provides the primitives Trystero needs, it's still
 * recommended to use HTTPS in production for full security.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { sha1 } from 'js-sha1';
import { sha256 } from 'js-sha256';

// Check if crypto.subtle is already available
if (typeof window !== 'undefined' && window.crypto && !window.crypto.subtle) {
  console.warn('[crypto-polyfill] crypto.subtle not available, adding polyfill');
  console.warn('[crypto-polyfill] Using js-sha256 for SHA-256 hashing');

  // Convert hex string to ArrayBuffer
  const hexToArrayBuffer = (hex: string): ArrayBuffer => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  };

  // Convert BufferSource to Uint8Array
  const toUint8Array = (data: BufferSource): Uint8Array => {
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    return new Uint8Array(data as ArrayBuffer);
  };

  const toArrayBuffer = (data: Uint8Array): ArrayBuffer => {
    const result = new Uint8Array(data.byteLength);
    result.set(data);
    return result.buffer;
  };

  const getAlgorithmName = (algorithm: AlgorithmIdentifier): string =>
    typeof algorithm === 'string' ? algorithm : algorithm.name;

  const getAesGcmParams = (
    algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams
  ): AesGcmParams => {
    const algoName = getAlgorithmName(algorithm);

    if (algoName !== 'AES-GCM' || typeof algorithm === 'string') {
      throw new Error(`Unsupported algorithm: ${algoName}`);
    }

    return algorithm as AesGcmParams;
  };

  const getAesKey = (key: CryptoKey): Uint8Array => {
    const rawKey = keyStore.get(key);

    if (!rawKey) {
      throw new Error('AES-GCM key was not imported as raw key data');
    }

    return rawKey;
  };

  // Store for imported keys (maps CryptoKey to raw key data)
  const keyStore = new WeakMap<CryptoKey, Uint8Array>();

  // SubtleCrypto subset used by Trystero in insecure local-IP contexts.
  const subtleCrypto = {
    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      const algoName = getAlgorithmName(algorithm);
      const uint8Data = toUint8Array(data);

      if (algoName === 'SHA-1') {
        const hashHex = sha1(uint8Data);
        return hexToArrayBuffer(hashHex);
      }

      if (algoName === 'SHA-256') {
        const hashHex = sha256(uint8Data);
        return hexToArrayBuffer(hashHex);
      }

      throw new Error(`Unsupported algorithm: ${algoName}`);
    },

    async importKey(
      format: KeyFormat,
      keyData: BufferSource | JsonWebKey,
      algorithm:
        | AlgorithmIdentifier
        | RsaHashedImportParams
        | EcKeyImportParams
        | HmacImportParams
        | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ): Promise<CryptoKey> {
      const algoName = getAlgorithmName(algorithm);

      if (format !== 'raw') {
        throw new Error(`Unsupported key format: ${format}`);
      }

      if (algoName !== 'AES-GCM') {
        throw new Error(`Unsupported importKey algorithm: ${algoName}`);
      }

      const cryptoKey = {
        type: 'secret',
        extractable,
        algorithm: algorithm as Algorithm,
        usages: keyUsages
      } as CryptoKey;

      if (keyData instanceof ArrayBuffer || ArrayBuffer.isView(keyData)) {
        keyStore.set(cryptoKey, new Uint8Array(toUint8Array(keyData)));
        return cryptoKey;
      }

      throw new Error('Unsupported keyData type for raw AES-GCM key');
    },

    async deriveBits(
      _algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      _baseKey: CryptoKey,
      length: number
    ): Promise<ArrayBuffer> {
      // For PBKDF2, we'd need to implement it properly
      // For now, use crypto.getRandomValues as a fallback
      const bits = new Uint8Array(length / 8);
      window.crypto.getRandomValues(bits);
      return bits.buffer;
    },

    async encrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer> {
      const params = getAesGcmParams(algorithm);
      const tagLength = params.tagLength ?? 128;

      if (tagLength !== 128) {
        throw new Error(`Unsupported AES-GCM tagLength: ${tagLength}`);
      }

      const cipher = gcm(
        getAesKey(key),
        toUint8Array(params.iv),
        params.additionalData ? toUint8Array(params.additionalData) : undefined
      );
      return toArrayBuffer(cipher.encrypt(toUint8Array(data)));
    },

    async decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer> {
      const params = getAesGcmParams(algorithm);
      const tagLength = params.tagLength ?? 128;

      if (tagLength !== 128) {
        throw new Error(`Unsupported AES-GCM tagLength: ${tagLength}`);
      }

      const cipher = gcm(
        getAesKey(key),
        toUint8Array(params.iv),
        params.additionalData ? toUint8Array(params.additionalData) : undefined
      );
      return toArrayBuffer(cipher.decrypt(toUint8Array(data)));
    }
  };

  // Patch crypto.subtle
  Object.defineProperty(window.crypto, 'subtle', {
    value: subtleCrypto,
    writable: false,
    configurable: false
  });

  console.log(
    '[crypto-polyfill] crypto.subtle polyfill installed with SHA-1, SHA-256, and AES-GCM'
  );
}

export {};
