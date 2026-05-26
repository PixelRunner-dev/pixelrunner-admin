import { existsSync } from 'node:fs';
import { readFile, writeFile, unlink, open } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL_GITHUB_INFO =
  'https://api.github.com/repos/joelacus/world-cities/commits?path=world_cities.json&sha=main&per_page=1';
const URL_DB_FILE =
  'https://github.com/joelacus/world-cities/raw/refs/heads/main/world_cities.json';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0';

const HASH_PATH = resolve('./scripts/hash.txt');
const DB_PATH = resolve('./src/geo_db.json');

export async function getLatestCommitHash({ fetchImpl = fetch } = {}) {
  const response = await fetchImpl(URL_GITHUB_INFO, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const jsonData = await response.json();
  const sha = jsonData?.[0]?.sha;
  if (!sha) throw new Error('Missing latest commit hash');
  return sha;
}

export async function getCurrentHash({
  existsImpl = existsSync,
  readFileImpl = readFile,
  hashPath = HASH_PATH
} = {}) {
  if (existsImpl(hashPath)) {
    return await readFileImpl(hashPath, { encoding: 'utf8' });
  }
  return '';
}

export async function updateDb({
  fetchImpl = fetch,
  openImpl = open,
  unlinkImpl = unlink,
  dbPath = DB_PATH
} = {}) {
  // Delete old file
  try {
    await unlinkImpl(dbPath);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Ignore if not exists
  }

  const response = await fetchImpl(URL_DB_FILE, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  if (!response.body?.getReader) throw new Error('Download failed: response body is not readable');

  const fileHandle = await openImpl(dbPath, 'w');
  const writer = fileHandle.createWriteStream();

  try {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writer.write(Buffer.from(value));
    }
  } finally {
    writer.end();
    await writer.closed;
    await fileHandle.close();
  }
}

export async function runUpdateGeoDb({
  consoleImpl = console,
  exitImpl = process.exit,
  writeFileImpl = writeFile,
  hashPath = HASH_PATH,
  getLatestCommitHashImpl = getLatestCommitHash,
  getCurrentHashImpl = getCurrentHash,
  updateDbImpl = updateDb
} = {}) {
  try {
    const latestHash = await getLatestCommitHashImpl();
    const currentHash = await getCurrentHashImpl();

    if (latestHash === currentHash) {
      consoleImpl.log('Already up to date');
      exitImpl(0);
      return;
    }

    await updateDbImpl();
    await writeFileImpl(hashPath, latestHash);
    consoleImpl.log('Done');
  } catch (err) {
    consoleImpl.error(err.message);
    exitImpl(1);
  }
}

if (process.env.VITEST !== 'true') {
  await runUpdateGeoDb();
}
