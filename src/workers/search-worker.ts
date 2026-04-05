import Fuse, { type IFuseOptions } from 'fuse.js';
import places from '@/geo_db.json';

export type Place = {
  name: string;
  lat: number;
  lng: number;
  country: string;
};

type MsgInit = { type: 'init'; data?: Place[] };
type MsgSearch = { type: 'search'; q: string; limit?: number };
type MsgReindex = { type: 'reindex'; data: Place[] };
type Incoming = MsgInit | MsgSearch | MsgReindex;

type OutReady = { type: 'ready' };
type OutResults = { type: 'results'; q: string; results: Place[] };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Outgoing = OutReady | OutResults;

const FUSE_OPTIONS: IFuseOptions<Place> = {
  keys: [
    { name: 'country', weight: 0.3 },
    { name: 'name', weight: 0.7 }
  ],
  includeScore: false,
  threshold: 0.33,
  ignoreLocation: true,
  minMatchCharLength: 2
};

let internalPlaces: Place[] = places as unknown as Place[];
let fuse: Fuse<Place> | null = null;

function normalizePlaces(data: Place[]): Place[] {
  return data.map((p) => ({
    ...p,
    name: String(p.name || ''),
    country: String(p.country || '')
  }));
}

function initIndex(data: Place[] = internalPlaces) {
  const normalized = normalizePlaces(data);
  internalPlaces = normalized;
  fuse = new Fuse(normalized, FUSE_OPTIONS);
}

initIndex();

function postReady() {
  (self as DedicatedWorkerGlobalScope).postMessage({ type: 'ready' } as OutReady);
}

postReady();

(self as DedicatedWorkerGlobalScope).onmessage = (ev: MessageEvent<Incoming>) => {
  const msg = ev.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'init') {
    if (Array.isArray(msg.data)) {
      initIndex(msg.data);
    } else {
      initIndex();
    }
    postReady();
    return;
  }

  if (msg.type === 'reindex') {
    initIndex(msg.data);
    postReady();
    return;
  }

  if (msg.type === 'search') {
    const q = String(msg.q || '');
    const limit = Number(msg.limit) || 10;
    if (!q || !fuse) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: 'results',
        q,
        results: []
      } as OutResults);
      return;
    }

    const lowerQ = q.toLowerCase();
    const prefixMatches: Place[] = [];
    for (const item of internalPlaces) {
      if (item.name.toLowerCase().startsWith(lowerQ)) {
        prefixMatches.push(item);
        if (prefixMatches.length >= limit) break;
      }
    }
    if (prefixMatches.length >= Math.min(3, limit)) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: 'results',
        q,
        results: prefixMatches.slice(0, limit)
      } as OutResults);
      return;
    }

    const fuseResults = fuse.search(q, { limit }).map((r) => r.item);
    const seen = new Set(prefixMatches.map((x) => x.name));
    const merged: Place[] = [...prefixMatches];
    for (const it of fuseResults) {
      if (!seen.has(it.name) && merged.length < limit) {
        merged.push(it);
        seen.add(it.name);
      }
      if (merged.length >= limit) break;
    }

    (self as DedicatedWorkerGlobalScope).postMessage({
      type: 'results',
      q,
      results: merged
    } as OutResults);
  }
};
