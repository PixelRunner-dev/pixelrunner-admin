import { describe, expect, it, vi } from 'vitest';

import {
  runDatabaseMigrations,
  type DatabaseMigrationResult
} from '@/services/device-maintenance.ts';
import type { DeviceAPI } from '@/ws/index.ts';

describe('device maintenance service', () => {
  it.each([null, undefined])('throws when the device RPC client is %s', async (device) => {
    await expect(runDatabaseMigrations(device)).rejects.toThrow(
      'Device RPC client is not available'
    );
  });

  it('runs database migrations through the device API with the maintenance timeout', async () => {
    const migrationResult: DatabaseMigrationResult = {
      code: 0,
      signal: null,
      stdout: 'migrations complete',
      stderr: ''
    };
    const device = {
      migrateDatabase: vi.fn().mockResolvedValue(migrationResult)
    } as unknown as DeviceAPI;

    await expect(runDatabaseMigrations(device)).resolves.toBe(migrationResult);
    expect(device.migrateDatabase).toHaveBeenCalledWith({ timeout: 120_000 });
  });

  it('propagates migration RPC failures', async () => {
    const rpcError = new Error('migration failed');
    const device = {
      migrateDatabase: vi.fn().mockRejectedValue(rpcError)
    } as unknown as DeviceAPI;

    await expect(runDatabaseMigrations(device)).rejects.toThrow(rpcError);
    expect(device.migrateDatabase).toHaveBeenCalledWith({ timeout: 120_000 });
  });
});
