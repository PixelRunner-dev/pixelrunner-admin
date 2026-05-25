import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateRandomUUID,
  isValidUUID,
  toCamelCase,
  toCapitalizeWords,
  toKebabCase,
  toPascalCase,
  vibrateDevice
} from '@/utils/generic.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('generic utilities', () => {
  it('validates UUID versions and variants', () => {
    expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('550E8400-E29B-41D4-8716-446655440000')).toBe(true);
    expect(isValidUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-c716-446655440000')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });

  it('uses crypto.randomUUID when available', () => {
    const randomUUID = vi.fn(() => '550e8400-e29b-41d4-a716-446655440000');
    vi.stubGlobal('crypto', { randomUUID });

    expect(generateRandomUUID()).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('generates a valid v4 UUID from crypto bytes when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((bytes: Uint8Array) => {
        bytes.set([0, 1, 2, 3, 4, 5, 0xff, 7, 0xff, 9, 10, 11, 12, 13, 14, 15]);
        return bytes;
      })
    });

    expect(generateRandomUUID()).toBe('00010203-0405-4f07-bf09-0a0b0c0d0e0f');
  });

  it('falls back to Math.random bytes when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(generateRandomUUID()).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('converts strings between common case formats', () => {
    expect(toKebabCase('deviceName')).toBe('device-name');
    expect(toKebabCase('DeviceName')).toBe('-device-name');
    expect(toCamelCase('device-name_value')).toBe('deviceNameValue');
    expect(toCamelCase('deviceName')).toBe('deviceName');
    expect(toPascalCase('device proxy mode')).toBe('DeviceProxyMode');
    expect(toPascalCase('device-proxy_mode')).toBe('DeviceProxyMode');
    expect(toCapitalizeWords('dEVice proxy')).toBe('Device Proxy');
    expect(toCapitalizeWords('')).toBe('');
  });

  it('vibrates supported devices with default and explicit lengths', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });

    vibrateDevice();
    vibrateDevice(4);

    expect(vibrate).toHaveBeenNthCalledWith(1, 10);
    expect(vibrate).toHaveBeenNthCalledWith(2, 4);
  });

  it('does nothing when vibration is not supported', () => {
    vi.stubGlobal('navigator', {});

    expect(() => vibrateDevice()).not.toThrow();
  });
});
