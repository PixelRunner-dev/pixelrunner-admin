import { describe, expect, it } from 'vitest';

import {
  compareVersions,
  extractControllerVersionFromStatus,
  getFeatureToggleSettingKey,
  isFeatureSupportedByControllerVersion
} from '@/utils/feature-toggles.ts';

describe('feature toggle helpers', () => {
  it('namespaces feature setting keys', () => {
    expect(getFeatureToggleSettingKey('debug')).toBe('featureToggle.debug');
  });

  it('compares semantic versions with missing patch parts', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.3.0', '1.2.9')).toBe(1);
    expect(compareVersions('1.2.0', '1.3.0')).toBe(-1);
    expect(compareVersions('1.2.3-mock', '1.2.3')).toBe(0);
  });

  it('extracts controller versions from current and legacy status shapes', () => {
    expect(
      extractControllerVersionFromStatus({
        versions: { controller: '1.2.2' }
      })
    ).toBe('1.2.2');

    expect(
      extractControllerVersionFromStatus({
        result: { versions: { controller: '1.2.3' } }
      })
    ).toBe('1.2.3');

    expect(
      extractControllerVersionFromStatus({
        result: { result: { versions: { controller: '1.2.4' } } }
      })
    ).toBe('1.2.4');
  });

  it('checks feature support against controller version', () => {
    expect(isFeatureSupportedByControllerVersion({ sinceVersion: '1.2.0' }, '1.2.0')).toBe(true);
    expect(isFeatureSupportedByControllerVersion({ sinceVersion: '1.2.0' }, '1.1.9')).toBe(false);
    expect(isFeatureSupportedByControllerVersion({ sinceVersion: '1.2.0' }, null)).toBe(false);
  });
});
