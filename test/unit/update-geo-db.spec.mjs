import { describe, expect, it, vi } from 'vitest';

import {
  getCurrentHash,
  getLatestCommitHash,
  runUpdateGeoDb,
  updateDb
} from '../../scripts/update-geo-db.mjs';

describe('update-geo-db script', () => {
  it('fetches the latest commit hash with the required GitHub request headers', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: vi.fn(async () => [{ sha: 'latest-sha' }])
    }));

    await expect(getLatestCommitHash({ fetchImpl })).resolves.toBe('latest-sha');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.github.com/repos/joelacus/world-cities/commits?path=world_cities.json&sha=main&per_page=1',
      expect.objectContaining({
        redirect: 'follow',
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('Firefox') })
      })
    );
  });

  it('fails when the latest hash request errors or returns malformed JSON', async () => {
    await expect(
      getLatestCommitHash({
        fetchImpl: vi.fn(async () => ({
          ok: false,
          status: 503
        }))
      })
    ).rejects.toThrow('HTTP 503');

    await expect(
      getLatestCommitHash({
        fetchImpl: vi.fn(async () => ({
          ok: true,
          json: vi.fn(async () => [])
        }))
      })
    ).rejects.toThrow('Missing latest commit hash');
  });

  it('returns the stored hash only when hash.txt exists', async () => {
    const readFileImpl = vi.fn(async () => 'current-sha');

    await expect(
      getCurrentHash({
        existsImpl: vi.fn(() => false),
        readFileImpl
      })
    ).resolves.toBe('');
    expect(readFileImpl).not.toHaveBeenCalled();

    await expect(
      getCurrentHash({
        existsImpl: vi.fn(() => true),
        readFileImpl,
        hashPath: '/tmp/hash.txt'
      })
    ).resolves.toBe('current-sha');
    expect(readFileImpl).toHaveBeenCalledWith('/tmp/hash.txt', { encoding: 'utf8' });
  });

  it('downloads the geo database stream, ignores missing old files, and closes resources', async () => {
    const { fileHandle, writer } = createWritableFileMock();
    const response = createStreamingResponse([new Uint8Array([1, 2]), new Uint8Array([3])]);
    const unlinkImpl = vi.fn(async () => {
      throw new Error('old file missing');
    });

    await updateDb({
      dbPath: '/tmp/geo_db.json',
      fetchImpl: vi.fn(async () => response),
      openImpl: vi.fn(async () => fileHandle),
      unlinkImpl
    });

    expect(unlinkImpl).toHaveBeenCalledWith('/tmp/geo_db.json');
    expect(response.reader.read).toHaveBeenCalledTimes(3);
    expect(writer.write).toHaveBeenNthCalledWith(1, Buffer.from([1, 2]));
    expect(writer.write).toHaveBeenNthCalledWith(2, Buffer.from([3]));
    expect(writer.end).toHaveBeenCalledOnce();
    expect(fileHandle.close).toHaveBeenCalledOnce();
  });

  it('fails database download on HTTP errors or unreadable response bodies', async () => {
    await expect(
      updateDb({
        fetchImpl: vi.fn(async () => ({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        }))
      })
    ).rejects.toThrow('Download failed: 404 Not Found');

    await expect(
      updateDb({
        fetchImpl: vi.fn(async () => ({
          ok: true,
          body: null
        }))
      })
    ).rejects.toThrow('Download failed: response body is not readable');
  });

  it('exits cleanly without updating when hashes match', async () => {
    const consoleImpl = createConsoleMock();
    const exitImpl = vi.fn();
    const updateDbImpl = vi.fn();
    const writeFileImpl = vi.fn();

    await runUpdateGeoDb({
      consoleImpl,
      exitImpl,
      getCurrentHashImpl: vi.fn(async () => 'same-sha'),
      getLatestCommitHashImpl: vi.fn(async () => 'same-sha'),
      updateDbImpl,
      writeFileImpl
    });

    expect(consoleImpl.log).toHaveBeenCalledWith('Already up to date');
    expect(exitImpl).toHaveBeenCalledWith(0);
    expect(updateDbImpl).not.toHaveBeenCalled();
    expect(writeFileImpl).not.toHaveBeenCalled();
  });

  it('updates the database, stores the new hash, and reports success', async () => {
    const consoleImpl = createConsoleMock();
    const exitImpl = vi.fn();
    const updateDbImpl = vi.fn(async () => undefined);
    const writeFileImpl = vi.fn(async () => undefined);

    await runUpdateGeoDb({
      consoleImpl,
      exitImpl,
      hashPath: '/tmp/hash.txt',
      getCurrentHashImpl: vi.fn(async () => 'old-sha'),
      getLatestCommitHashImpl: vi.fn(async () => 'new-sha'),
      updateDbImpl,
      writeFileImpl
    });

    expect(updateDbImpl).toHaveBeenCalledOnce();
    expect(writeFileImpl).toHaveBeenCalledWith('/tmp/hash.txt', 'new-sha');
    expect(consoleImpl.log).toHaveBeenCalledWith('Done');
    expect(exitImpl).not.toHaveBeenCalledWith(1);
  });

  it('logs fatal errors and exits with failure', async () => {
    const consoleImpl = createConsoleMock();
    const exitImpl = vi.fn();

    await runUpdateGeoDb({
      consoleImpl,
      exitImpl,
      getLatestCommitHashImpl: vi.fn(async () => {
        throw new Error('network down');
      })
    });

    expect(consoleImpl.error).toHaveBeenCalledWith('network down');
    expect(exitImpl).toHaveBeenCalledWith(1);
  });
});

function createStreamingResponse(chunks) {
  const pending = [...chunks];
  const reader = {
    read: vi.fn(async () => {
      const value = pending.shift();
      return value ? { done: false, value } : { done: true };
    })
  };

  return {
    ok: true,
    body: {
      getReader: vi.fn(() => reader)
    },
    reader
  };
}

function createWritableFileMock() {
  const writer = {
    closed: Promise.resolve(),
    end: vi.fn(),
    write: vi.fn()
  };
  const fileHandle = {
    close: vi.fn(async () => undefined),
    createWriteStream: vi.fn(() => writer)
  };

  return {
    fileHandle,
    writer
  };
}

function createConsoleMock() {
  return {
    error: vi.fn(),
    log: vi.fn()
  };
}
