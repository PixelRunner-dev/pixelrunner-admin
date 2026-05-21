import {
  FEATURE_TOGGLE_LIST,
  FEATURE_TOGGLE_SETTING_PREFIX,
  type FeatureToggleItem,
  type FeatureToggleKey
} from '@/constants.ts';

const FEATURE_TOGGLE_KEYS = new Set<string>(FEATURE_TOGGLE_LIST.map(({ key }) => key));

export function getFeatureToggleSettingKey(key: FeatureToggleKey | string): string {
  return `${FEATURE_TOGGLE_SETTING_PREFIX}${key}`;
}

export function isFeatureToggleKey(key: string): key is FeatureToggleKey {
  return FEATURE_TOGGLE_KEYS.has(key);
}

export function getFeatureToggleItem(
  key: FeatureToggleKey | string
): FeatureToggleItem | undefined {
  return FEATURE_TOGGLE_LIST.find((feature) => feature.key === key);
}

export function parseBooleanSetting(value: unknown): boolean {
  return value === true || value === 'true';
}

function parseNumericVersionParts(version: string): number[] | null {
  const match = version.match(/\d+(?:\.\d+)*/);
  if (!match) {
    return null;
  }

  return match[0].split('.').map((part) => Number(part));
}

export function compareVersions(currentVersion: string, minimumVersion: string): number {
  const currentParts = parseNumericVersionParts(currentVersion);
  const minimumParts = parseNumericVersionParts(minimumVersion);

  if (!currentParts || !minimumParts) {
    return -1;
  }

  const partCount = Math.max(currentParts.length, minimumParts.length);
  for (let index = 0; index < partCount; index += 1) {
    const currentPart = currentParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;

    if (currentPart > minimumPart) return 1;
    if (currentPart < minimumPart) return -1;
  }

  return 0;
}

export function isFeatureSupportedByControllerVersion(
  feature: Pick<FeatureToggleItem, 'sinceVersion'>,
  controllerVersion: string | null
): boolean {
  console.log('controllerVersion', controllerVersion);
  if (!controllerVersion) {
    return false;
  }

  return compareVersions(controllerVersion, feature.sinceVersion) >= 0;
}

export function extractControllerVersionFromStatus(status: unknown): string | null {
  if (!status || typeof status !== 'object') {
    return null;
  }

  const response = status as {
    result?: {
      versions?: { controller?: unknown };
      result?: { versions?: { controller?: unknown } };
    };
  };
  const controllerVersion =
    response.result?.versions?.controller ?? response.result?.result?.versions?.controller;

  return typeof controllerVersion === 'string' && controllerVersion.length > 0
    ? controllerVersion
    : null;
}
