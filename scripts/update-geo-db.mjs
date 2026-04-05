import { existsSync } from 'node:fs';
import { readFile, writeFile, unlink, open } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL_GITHUB_INFO = 'https://api.github.com/repos/joelacus/world-cities/commits?path=world_cities.json&sha=main&per_page=1';
const URL_DB_FILE = 'https://github.com/joelacus/world-cities/raw/refs/heads/main/world_cities.json';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0';

const HASH_PATH = resolve('./scripts/hash.txt');
const DB_PATH = resolve('./src/geo_db.json');

async function getLatestCommitHash() {
  const response = await fetch(URL_GITHUB_INFO, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const jsonData = await response.json();
  return jsonData[0].sha;
}

async function getCurrentHash() {
  if (existsSync(HASH_PATH)) {
    return await readFile(HASH_PATH, { encoding: 'utf8' });
  }
  return '';
}

async function updateDb() {
  // Delete old file
  try {
    await unlink(DB_PATH);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Ignore if not exists
  }

  const response = await fetch(URL_DB_FILE, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);

  const fileHandle = await open(DB_PATH, 'w');
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

try {
  const latestHash = await getLatestCommitHash();
  const currentHash = await getCurrentHash();

  if (latestHash === currentHash) {
    console.log('Already up to date');
    process.exit(0);
  }

  await updateDb();
  await writeFile(HASH_PATH, latestHash);
  console.log('Done');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
