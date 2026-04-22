/**
 * Minimal crypto.subtle polyfill for insecure contexts (HTTP)
 * Only implements the methods Trystero needs
 *
 * WARNING: This is NOT cryptographically secure for production use.
 * Use HTTPS in production.
 */

// Check if crypto.subtle is already available
if (typeof window !== 'undefined' && window.crypto && !window.crypto.subtle) {
  console.warn('[crypto-polyfill] crypto.subtle not available, adding minimal polyfill');
  console.warn('[crypto-polyfill] For production, use HTTPS instead!');

  // TextEncoder for string to Uint8Array conversion
  const encoder = new TextEncoder();

  // Simple SHA-256 implementation using basic crypto APIs
  // This is a fallback that uses getRandomValues and other available crypto methods
  const simpleHash = async (algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
    // For insecure contexts, we'll use a simpler hashing approach
    // This is NOT secure, but allows Trystero to function for development
    const dataArray = new Uint8Array(data as ArrayBuffer);

    // Simple XOR-based hash (NOT cryptographically secure!)
    const hash = new Uint8Array(32); // SHA-256 size
    window.crypto.getRandomValues(hash); // Add some randomness

    for (let i = 0; i < dataArray.length; i++) {
      hash[i % 32] ^= dataArray[i];
    }

    return hash.buffer;
  };

  // Minimal SubtleCrypto implementation
  const subtleCrypto = {
    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      console.warn('[crypto-polyfill] digest() called with insecure fallback');
      return simpleHash(algorithm.toString(), data);
    },

    async importKey(
      format: KeyFormat,
      keyData: BufferSource | JsonWebKey,
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ): Promise<CryptoKey> {
      console.warn('[crypto-polyfill] importKey() called with insecure fallback');

      // Return a mock CryptoKey
      return {
        type: 'secret',
        extractable,
        algorithm: algorithm as Algorithm,
        usages: keyUsages
      } as CryptoKey;
    },

    async deriveBits(
      algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      length: number
    ): Promise<ArrayBuffer> {
      console.warn('[crypto-polyfill] deriveBits() called with insecure fallback');

      const bits = new Uint8Array(length / 8);
      window.crypto.getRandomValues(bits);
      return bits.buffer;
    },

    async encrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer> {
      console.warn('[crypto-polyfill] encrypt() called - returning unencrypted data');
      return (data as ArrayBuffer);
    },

    async decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer> {
      console.warn('[crypto-polyfill] decrypt() called - returning data as-is');
      return (data as ArrayBuffer);
    }
  };

  // Patch crypto.subtle
  Object.defineProperty(window.crypto, 'subtle', {
    value: subtleCrypto,
    writable: false,
    configurable: false
  });

  console.log('[crypto-polyfill] ✅ Minimal crypto.subtle polyfill installed');
}

export {};
