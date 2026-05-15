import type { DeviceAPI } from '@/ws/index.ts';

export interface DatabaseMigrationResult {
  code: number | null;
  signal?: string | null;
  stdout?: string;
  stderr?: string;
}

const REQUEST_TIMEOUT_MS = 120_000;

export async function runDatabaseMigrations(
  device: DeviceAPI | null | undefined
): Promise<DatabaseMigrationResult> {
  if (!device) {
    throw new Error('Device RPC client is not available');
  }

  return await device.migrateDatabase({ timeout: REQUEST_TIMEOUT_MS });
}
