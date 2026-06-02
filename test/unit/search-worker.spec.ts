import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Place } from '@/workers/search-worker.ts';

type GeoDbModuleEntry = {
  country: string;
  name: string;
  lat: string;
  lng: string;
};

const mockedGeoDb = vi.hoisted(() => [] as Array<GeoDbModuleEntry | Place>);

vi.mock('@/geo_db.json', () => ({
  default: mockedGeoDb
}));

const geoDbModule: GeoDbModuleEntry[] = [
  {
    country: 'NL',
    name: 'Amsterdam',
    lat: '52.36757',
    lng: '4.90414'
  },
  {
    country: 'NL',
    name: 'Rotterdam',
    lat: '51.92442',
    lng: '4.47773'
  }
];

type SearchWorkerIncoming =
  | { type: 'init'; data?: Place[] }
  | { type: 'reindex'; data: Place[] }
  | { type: 'search'; q?: unknown; limit?: unknown }
  | { type?: unknown };

type SearchWorkerMessage = { type: 'ready' } | { type: 'results'; q: string; results: Place[] };

type WorkerScope = {
  onmessage: ((event: MessageEvent<SearchWorkerIncoming>) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
};

const originalSelfPostMessage = globalThis.self.postMessage;
const originalSelfOnMessage = globalThis.self.onmessage;

describe('search worker', () => {
  afterEach(() => {
    Object.defineProperty(globalThis.self, 'postMessage', {
      configurable: true,
      writable: true,
      value: originalSelfPostMessage
    });
    globalThis.self.onmessage = originalSelfOnMessage;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('posts ready on load and ignores empty or malformed messages', async () => {
    const worker = await loadWorker();

    expect(worker.messages).toEqual([{ type: 'ready' }]);

    worker.send(undefined);
    worker.send({});

    expect(worker.messages).toEqual([{ type: 'ready' }]);
  }, 15000);

  it('returns empty results for empty search queries', async () => {
    const worker = await loadWorker();

    worker.send({ type: 'search', q: '', limit: 5 });
    worker.send({ type: 'search', q: null, limit: 5 });

    expect(resultMessages(worker.messages)).toEqual([
      { type: 'results', q: '', results: [] },
      { type: 'results', q: '', results: [] }
    ]);
  });

  it('rebuilds the current index when init does not provide custom data', async () => {
    const worker = await loadWorker();

    worker.send({ type: 'reindex', data: [createPlace('Zurich', 'Switzerland')] });
    worker.send({ type: 'search', q: 'Zurich', limit: 5 });
    expect(lastResults(worker.messages).map((place) => place.name)).toEqual(['Zurich']);

    worker.send({ type: 'init' });
    worker.send({ type: 'search', q: 'Zurich', limit: 5 });

    expect(worker.messages.filter((message) => message.type === 'ready')).toHaveLength(3);
    expect(lastResults(worker.messages).map((place) => place.name)).toEqual(['Zurich']);
  });

  it('normalizes init data and searches the rebuilt index', async () => {
    const worker = await loadWorker();
    const malformedPlace = {
      name: null,
      lat: 1,
      lng: 2,
      country: 42
    } as unknown as Place;

    worker.send({ type: 'init', data: [malformedPlace] });
    worker.send({ type: 'search', q: '42', limit: 5 });

    expect(lastResults(worker.messages)).toEqual([
      {
        name: '',
        lat: 1,
        lng: 2,
        country: '42'
      }
    ]);
  });

  it('returns prefix matches directly when enough results satisfy the limit', async () => {
    const worker = await loadWorker([
      createPlace('Amsterdam', 'Netherlands'),
      createPlace('Athens', 'Greece'),
      createPlace('Austin', 'United States')
    ]);

    worker.send({ type: 'search', q: 'A', limit: 2 });

    expect(lastResults(worker.messages).map((place) => place.name)).toEqual([
      'Amsterdam',
      'Athens'
    ]);
  });

  it('falls back to Fuse country/name search when prefix matches are insufficient', async () => {
    const worker = await loadWorker([
      createPlace('Amsterdam', 'Netherlands'),
      createPlace('Athens', 'Greece'),
      createPlace('Rotterdam', 'Netherlands')
    ]);

    worker.send({ type: 'search', q: 'Netherlands', limit: 2 });

    expect(lastResults(worker.messages).map((place) => place.name)).toEqual([
      'Amsterdam',
      'Rotterdam'
    ]);
  });

  it('merges prefix and Fuse matches without duplicate names', async () => {
    const worker = await loadWorker([
      createPlace('York', 'United States'),
      createPlace('New York', 'United States'),
      createPlace('Yorkshire', 'United Kingdom'),
      createPlace('Berlin', 'Germany')
    ]);

    worker.send({ type: 'search', q: 'York', limit: 4 });

    expect(lastResults(worker.messages).map((place) => place.name)).toEqual([
      'York',
      'Yorkshire',
      'New York'
    ]);
  });

  it('treats non-positive and missing limits as the default limit', async () => {
    const manyPlaces = Array.from({ length: 12 }, (_, index) =>
      createPlace(`A-place-${index}`, 'Testland')
    );
    const worker = await loadWorker(manyPlaces);

    worker.send({ type: 'search', q: 'A', limit: 0 });
    expect(lastResults(worker.messages)).toHaveLength(10);

    worker.send({ type: 'search', q: 'A' });
    expect(lastResults(worker.messages)).toHaveLength(10);
  });
});

async function loadWorker(data: ReadonlyArray<GeoDbModuleEntry | Place> = geoDbModule) {
  const messages: SearchWorkerMessage[] = [];
  const selfScope = globalThis.self as typeof globalThis.self & WorkerScope;

  selfScope.onmessage = null;
  Object.defineProperty(selfScope, 'postMessage', {
    configurable: true,
    writable: true,
    value: vi.fn((message: SearchWorkerMessage) => {
      messages.push(message);
    })
  });

  mockedGeoDb.splice(0, mockedGeoDb.length, ...data);

  await import('@/workers/search-worker.ts');

  return {
    messages,
    send: (data: SearchWorkerIncoming | undefined) => {
      selfScope.onmessage?.({ data } as MessageEvent<SearchWorkerIncoming>);
    }
  };
}

function createPlace(name: string, country: string): Place {
  return {
    name,
    lat: 52,
    lng: 4,
    country
  };
}

function lastResults(messages: SearchWorkerMessage[]): Place[] {
  const result = [...messages]
    .reverse()
    .find(
      (message): message is Extract<SearchWorkerMessage, { type: 'results' }> =>
        message.type === 'results'
    );

  return result?.results ?? [];
}

function resultMessages(
  messages: SearchWorkerMessage[]
): Extract<SearchWorkerMessage, { type: 'results' }>[] {
  return messages.filter(
    (message): message is Extract<SearchWorkerMessage, { type: 'results' }> =>
      message.type === 'results'
  );
}
