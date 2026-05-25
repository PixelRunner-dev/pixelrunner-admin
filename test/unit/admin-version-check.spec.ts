import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createCacheBustedUrl,
  isAdminUpdateAvailable
} from '@/composables/useAdminVersionCheck.ts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isAdminUpdateAvailable', () => {
  it('returns true when the manifest build differs from the loaded build', () => {
    expect(isAdminUpdateAvailable({ adminBuildId: 'new-build' }, 'old-build')).toBe(true);
  });

  it('returns false when the manifest build matches the loaded build', () => {
    expect(isAdminUpdateAvailable({ adminBuildId: 'same-build' }, 'same-build')).toBe(false);
  });

  it('returns false when the manifest does not include an admin build id', () => {
    expect(isAdminUpdateAvailable({}, 'current-build')).toBe(false);
  });
});

describe('createCacheBustedUrl', () => {
  it('adds the target build id and reload timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123_456);

    expect(createCacheBustedUrl(new URL('https://admin.example/applets'), 'build-2')).toBe(
      'https://admin.example/applets?adminBuildId=build-2&adminReloadAt=123456'
    );
  });

  it('preserves existing query parameters', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123_456);

    expect(createCacheBustedUrl(new URL('https://admin.example/applets?tab=config'))).toBe(
      'https://admin.example/applets?tab=config&adminReloadAt=123456'
    );
  });
});
