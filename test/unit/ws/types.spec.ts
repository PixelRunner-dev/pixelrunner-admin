import { describe, it, expect } from 'vitest';
import type {
  DeviceStatusResult,
  DeviceStatusResponse,
  DeviceUpdateResult,
  DeviceUpdateResponse
} from '@/ws/types';

describe('src/ws/types.ts', () => {
  describe('DeviceStatusResult', () => {
    it('accepts valid idle status', () => {
      const status: DeviceStatusResult = {
        status: 'idle',
        uptime: [100, 200],
        updateAvailable: false
      };
      expect(status.status).toBe('idle');
    });

    it('accepts busy status', () => {
      const status: DeviceStatusResult = {
        status: 'busy',
        uptime: [null, 0],
        updateAvailable: true
      };
      expect(status.status).toBe('busy');
    });

    it('accepts error status', () => {
      const status: DeviceStatusResult = {
        status: 'error',
        uptime: [null, 0],
        updateAvailable: false
      };
      expect(status.status).toBe('error');
    });

    it('accepts optional cpus field', () => {
      const status: DeviceStatusResult = {
        status: 'idle',
        uptime: [50, 100],
        updateAvailable: false,
        cpus: [{ model: 'ARM' }]
      };
      expect(status.cpus).toHaveLength(1);
    });

    it('accepts optional memory field as tuple', () => {
      const status: DeviceStatusResult = {
        status: 'idle',
        uptime: [50, 100],
        updateAvailable: false,
        memory: [256, 512, 1024]
      };
      expect(status.memory).toEqual([256, 512, 1024]);
    });

    it('accepts optional versions field', () => {
      const status: DeviceStatusResult = {
        status: 'idle',
        uptime: [50, 100],
        updateAvailable: false,
        versions: {
          admin: '1.0.0',
          applets: '2.0.0',
          controller: '3.0.0',
          shared: '4.0.0',
          os: '5.0.0'
        }
      };
      expect(status.versions?.admin).toBe('1.0.0');
    });

    it('allows null first element in uptime tuple', () => {
      const status: DeviceStatusResult = {
        status: 'idle',
        uptime: [null, 0],
        updateAvailable: false
      };
      expect(status.uptime[0]).toBeNull();
    });
  });

  describe('DeviceUpdateResult', () => {
    it('accepts empty result', () => {
      const update: DeviceUpdateResult = {};
      expect(update.result).toBeUndefined();
    });

    it('accepts all update statuses', () => {
      const update: DeviceUpdateResult = {
        result: {
          admin: 'idle',
          applets: 'downloading',
          controller: 'installing',
          shared: 'done',
          os: 'error'
        }
      };
      expect(update.result?.admin).toBe('idle');
      expect(update.result?.applets).toBe('downloading');
    });

    it('accepts restarting status', () => {
      const update: DeviceUpdateResult = {
        result: {
          admin: 'restarting',
          applets: 'skipping',
          controller: 'idle',
          shared: 'idle',
          os: 'idle'
        }
      };
      expect(update.result?.admin).toBe('restarting');
    });
  });
});
