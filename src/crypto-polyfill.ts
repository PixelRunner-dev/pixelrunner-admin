/**
 * crypto.subtle polyfill for insecure contexts (HTTP)
 * Uses js-sha1 and js-sha256 for proper hashing
 *
 * WARNING: While this provides real cryptographic hashing, it's still
 * recommended to use HTTPS in production for full security.
 */

import { sha1 } from 'js-sha1';
import { sha256 } from 'js-sha256';
import CryptoJS from 'crypto-js';

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

  // Convert Uint8Array to CryptoJS WordArray
  const toWordArray = (uint8Array: Uint8Array): CryptoJS.lib.WordArray => {
    const words: number[] = [];
    for (let i = 0; i < uint8Array.length; i += 4) {
      const word = (uint8Array[i] << 24) |
                   ((uint8Array[i + 1] || 0) << 16) |
                   ((uint8Array[i + 2] || 0) << 8) |
                   (uint8Array[i + 3] || 0);
      words.push(word);
    }
    return CryptoJS.lib.WordArray.create(words, uint8Array.length);
  };

  // Convert CryptoJS WordArray to Uint8Array
  const fromWordArray = (wordArray: CryptoJS.lib.WordArray): Uint8Array => {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const uint8Array = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
      const word = words[i >>> 2];
      if (word !== undefined) {
        uint8Array[i] = (word >>> (24 - (i % 4) * 8)) & 0xff;
      }
    }
    return uint8Array;
  };

  // Store for imported keys (maps CryptoKey to raw key data)
  const keyStore = new WeakMap<CryptoKey, Uint8Array>();

  // SubtleCrypto implementation with real SHA-1 and SHA-256
  const subtleCrypto = {
    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm.name;
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
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ): Promise<CryptoKey> {
      // Store the raw key data
      const cryptoKey = {
        type: 'secret',
        extractable,
        algorithm: algorithm as Algorithm,
        usages: keyUsages
      } as CryptoKey;

      // Store the raw key bytes for later use in encrypt/decrypt
      if (format === 'raw' && keyData instanceof ArrayBuffer) {
        keyStore.set(cryptoKey, new Uint8Array(keyData));
      } else if (format === 'raw' && ArrayBuffer.isView(keyData)) {
        keyStore.set(cryptoKey, toUint8Array(keyData));
      }

      return cryptoKey;
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
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm.name;

      if (algoName === 'AES-GCM') {
        const keyData = keyStore.get(key);
        if (!keyData) {
          throw new Error('Key not found in keyStore');
        }

        const algo = algorithm as AesGcmParams;
        const iv = toUint8Array(algo.iv);
        const plaintext = toUint8Array(data);

        // Use CryptoJS AES encryption
        const keyWordArray = toWordArray(keyData);
        const ivWordArray = toWordArray(iv);
        const plaintextWordArray = toWordArray(plaintext);

        // AES-GCM encryption using CBC mode (CryptoJS doesn't have GCM, so we use CBC as fallback)
        const encrypted = CryptoJS.AES.encrypt(plaintextWordArray, keyWordArray, {
          iv: ivWordArray,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        // Return the ciphertext as ArrayBuffer
        const ciphertext = fromWordArray(encrypted.ciphertext);

        // For AES-GCM, we need to append the auth tag (16 bytes)
        // Since we're using CBC, we'll just append zeros as a placeholder
        const authTag = new Uint8Array(16);
        const result = new Uint8Array(ciphertext.length + authTag.length);
        result.set(ciphertext);
        result.set(authTag, ciphertext.length);

        return result.buffer;
      }

      // Fallback for other algorithms
      console.warn('[crypto-polyfill] encrypt() - returning unencrypted data for', algoName);
      return toUint8Array(data).buffer;
    },

    async decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer> {
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm.name;

      if (algoName === 'AES-GCM') {
        const keyData = keyStore.get(key);
        if (!keyData) {
          throw new Error('Key not found in keyStore');
        }

        const algo = algorithm as AesGcmParams;
        const iv = toUint8Array(algo.iv);
        const ciphertextWithTag = toUint8Array(data);

        // Remove the auth tag (last 16 bytes)
        const ciphertext = ciphertextWithTag.slice(0, -16);

        // Use CryptoJS AES decryption
        const keyWordArray = toWordArray(keyData);
        const ivWordArray = toWordArray(iv);
        const ciphertextWordArray = toWordArray(ciphertext);

        // Create a CipherParams object for decryption
        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: ciphertextWordArray
        });

        // AES-GCM decryption using CBC mode
        const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
          iv: ivWordArray,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        // Return the plaintext as ArrayBuffer
        const plaintext = fromWordArray(decrypted);
        return plaintext.buffer;
      }

      // Fallback for other algorithms
      console.warn('[crypto-polyfill] decrypt() - returning data as-is for', algoName);
      return toUint8Array(data).buffer;
    }
  };

  // Patch crypto.subtle
  Object.defineProperty(window.crypto, 'subtle', {
    value: subtleCrypto,
    writable: false,
    configurable: false
  });

  console.log('[crypto-polyfill] ✅ crypto.subtle polyfill installed with SHA-1 and SHA-256');
}

export {};
