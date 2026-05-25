import { describe, expect, it } from 'vitest';

import { getRandomCategories, MockRpcClient } from '@/mocks/mock-rpc-client.ts';

import type { ICategory, IPlaylist } from 'pixelrunner-shared';

describe('MockRpcClient', () => {
  it('returns a random non-empty category subset', () => {
    const values = [0.2, 0.8, 0.4, 0.6];
    let index = 0;
    const categories = getRandomCategories(() => values[index++] ?? 0.5);

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.length).toBeLessThanOrEqual(3);
    expect(new Set(categories.map((category) => category.key)).size).toBe(categories.length);
    expect(categories.every((category) => !('name' in category))).toBe(true);
  });

  it('connects without a controller and returns an active playlist', async () => {
    const client = new MockRpcClient();

    await client.connect();
    const playlist = await client.request<IPlaylist>('playlists.activePlaylist');

    expect(client.isConnected.value).toBe(true);
    expect(playlist.name).toBe('Mock Playlist');
    expect(playlist.applets.length).toBeGreaterThan(0);
  });

  it('mocks a zero-byte alert applet with the broken image fallback', async () => {
    const client = new MockRpcClient();

    await client.connect();
    const playlist = await client.request<IPlaylist>('playlists.activePlaylist');
    const alertApplet = playlist.applets.find((applet) => applet.packageName === 'knmialert');

    expect(alertApplet?.installationDetails?.image.src).toBe('/broken-image.webp');
    expect(alertApplet?.installationDetails?.appliedConfigurations?.appId).toBe('knmialert');
  });

  it('filters applets by category key', async () => {
    const client = new MockRpcClient();

    const response = await client.request<{ data: { categories: ICategory[] }[] }>(
      'applets.action',
      {
        method: 'getAppletsByCategoryKey',
        params: { categoryKey: 'starter_pack' }
      }
    );

    expect(response.data.length).toBeGreaterThan(0);
    expect(
      response.data.every((applet) =>
        applet.categories.some((category) => category.key === 'starter_pack')
      )
    ).toBe(true);
  });

  it('persists setting writes in memory', async () => {
    const client = new MockRpcClient();

    await client.request('settings.action', {
      method: 'setValue',
      params: { key: 'brightness', value: '75' }
    });

    const response = await client.request<{ data?: { value: string } }>('settings.action', {
      method: 'getValue',
      params: { key: 'brightness' }
    });

    expect(response.data?.value).toBe('75');
  });
});
