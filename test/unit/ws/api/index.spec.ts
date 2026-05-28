import { describe, it, expect } from 'vitest';
import * as apiIndex from '@/ws/api/index';

describe('src/ws/api/index.ts', () => {
  it('exports isRpcClient', () => {
    expect(typeof apiIndex.isRpcClient).toBe('function');
  });

  it('exports ApiClientBase', () => {
    expect(typeof apiIndex.ApiClientBase).toBe('function');
  });

  it('exports DeviceAPI', () => {
    expect(typeof apiIndex.DeviceAPI).toBe('function');
  });

  it('exports AppletAPI', () => {
    expect(typeof apiIndex.AppletAPI).toBe('function');
  });

  it('exports SettingsAPI', () => {
    expect(typeof apiIndex.SettingsAPI).toBe('function');
  });

  it('exports PlaylistsAPI', () => {
    expect(typeof apiIndex.PlaylistsAPI).toBe('function');
  });

  it('isRpcClient is callable', () => {
    expect(apiIndex.isRpcClient(null)).toBe(false);
    expect(apiIndex.isRpcClient({})).toBe(false);
  });
});
