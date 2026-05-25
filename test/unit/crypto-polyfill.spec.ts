import { afterEach, describe, expect, it, vi } from 'vitest';

type PolyfilledSubtle = {
  decrypt(
    algorithm: AlgorithmIdentifier | AesGcmParams,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>;
  deriveBits(
    algorithm: AlgorithmIdentifier,
    baseKey: CryptoKey,
    length: number
  ): Promise<ArrayBuffer>;
  digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
  encrypt(
    algorithm: AlgorithmIdentifier | AesGcmParams,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer>;
  importKey(
    format: KeyFormat,
    keyData: BufferSource | JsonWebKey,
    algorithm: AlgorithmIdentifier | AesKeyAlgorithm,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey>;
};

const textEncoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function importPolyfillWithCrypto(
  cryptoValue: Record<string, unknown> & { subtle?: PolyfilledSubtle | SubtleCrypto }
): Promise<PolyfilledSubtle> {
  vi.resetModules();
  vi.stubGlobal('window', {
    crypto: cryptoValue
  });
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);

  await import('@/crypto-polyfill.ts');

  return cryptoValue.subtle as PolyfilledSubtle;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('crypto subtle polyfill', () => {
  it('does not replace an existing subtle implementation', async () => {
    const existingSubtle = {
      digest: vi.fn()
    } as unknown as SubtleCrypto;
    const subtle = await importPolyfillWithCrypto({ subtle: existingSubtle });

    expect(subtle).toBe(existingSubtle);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('installs digest support for SHA-1 and SHA-256', async () => {
    const subtle = await importPolyfillWithCrypto({
      getRandomValues: vi.fn()
    });

    await expect(subtle?.digest('SHA-1', textEncoder.encode('pixel'))).resolves.toSatisfy(
      (buffer: ArrayBuffer) => toHex(buffer) === '03dc8cb268d33b11f8f5f4d879b65434c0ae2840'
    );
    await expect(
      subtle?.digest({ name: 'SHA-256' }, textEncoder.encode('runner').buffer)
    ).resolves.toSatisfy(
      (buffer: ArrayBuffer) =>
        toHex(buffer) === '527aa9f431539da8e151d5434d1d5e611d973f601d8e970790882624554146b0'
    );
    await expect(subtle?.digest('SHA-384', textEncoder.encode('x'))).rejects.toThrow(
      'Unsupported algorithm: SHA-384'
    );
  });

  it('imports raw AES-GCM keys and preserves key metadata', async () => {
    const subtle = await importPolyfillWithCrypto({
      getRandomValues: vi.fn()
    });
    const keyData = new Uint8Array(16).fill(7);

    const key = await subtle?.importKey('raw', keyData, { name: 'AES-GCM', length: 128 }, false, [
      'encrypt',
      'decrypt'
    ]);

    expect(key).toMatchObject({
      type: 'secret',
      extractable: false,
      usages: ['encrypt', 'decrypt'],
      algorithm: { name: 'AES-GCM', length: 128 }
    });
    await expect(
      subtle?.importKey('jwk', keyData, { name: 'AES-GCM', length: 128 }, false, ['encrypt'])
    ).rejects.toThrow('Unsupported key format: jwk');
    await expect(
      subtle?.importKey('raw', keyData, { name: 'HMAC' }, false, ['sign'])
    ).rejects.toThrow('Unsupported importKey algorithm: HMAC');
    await expect(
      subtle?.importKey('raw', { kty: 'oct' }, { name: 'AES-GCM', length: 128 }, false, ['encrypt'])
    ).rejects.toThrow('Unsupported keyData type for raw AES-GCM key');
  });

  it('encrypts and decrypts AES-GCM data with additional authenticated data', async () => {
    const subtle = await importPolyfillWithCrypto({
      getRandomValues: vi.fn()
    });
    const key = await subtle?.importKey(
      'raw',
      new Uint8Array(16).fill(9),
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt', 'decrypt']
    );
    const params = {
      name: 'AES-GCM',
      iv: new Uint8Array(12).fill(3),
      additionalData: textEncoder.encode('meta')
    };

    const encrypted = await subtle?.encrypt(params, key as CryptoKey, textEncoder.encode('secret'));
    const decrypted = await subtle?.decrypt(params, key as CryptoKey, encrypted as ArrayBuffer);

    expect(new TextDecoder().decode(decrypted)).toBe('secret');

    const encryptedWithoutAdditionalData = await subtle?.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12).fill(4) },
      key as CryptoKey,
      textEncoder.encode('plain')
    );
    const decryptedWithoutAdditionalData = await subtle?.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12).fill(4) },
      key as CryptoKey,
      encryptedWithoutAdditionalData as ArrayBuffer
    );

    expect(new TextDecoder().decode(decryptedWithoutAdditionalData)).toBe('plain');
  });

  it('rejects unsupported AES-GCM parameters and unknown keys', async () => {
    const subtle = await importPolyfillWithCrypto({
      getRandomValues: vi.fn()
    });
    const key = await subtle?.importKey(
      'raw',
      new Uint8Array(16).fill(1),
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt']
    );

    await expect(
      subtle?.encrypt('AES-GCM', key as CryptoKey, textEncoder.encode('secret'))
    ).rejects.toThrow('Unsupported algorithm: AES-GCM');
    await expect(
      subtle?.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12), tagLength: 96 },
        key as CryptoKey,
        textEncoder.encode('secret')
      )
    ).rejects.toThrow('Unsupported AES-GCM tagLength: 96');
    await expect(
      subtle?.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12), tagLength: 96 },
        key as CryptoKey,
        new Uint8Array(16)
      )
    ).rejects.toThrow('Unsupported AES-GCM tagLength: 96');
    await expect(
      subtle?.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        { type: 'secret' } as CryptoKey,
        textEncoder.encode('secret')
      )
    ).rejects.toThrow('AES-GCM key was not imported as raw key data');
  });

  it('derives fallback bits with getRandomValues', async () => {
    const getRandomValues = vi.fn(<T extends ArrayBufferView>(target: T) => {
      new Uint8Array(target.buffer, target.byteOffset, target.byteLength).set([4, 3, 2, 1]);
      return target;
    });
    const subtle = await importPolyfillWithCrypto({ getRandomValues });

    const bits = await subtle?.deriveBits('PBKDF2', {} as CryptoKey, 32);

    expect(Array.from(new Uint8Array(bits))).toEqual([4, 3, 2, 1]);
    expect(getRandomValues).toHaveBeenCalledOnce();
  });
});
