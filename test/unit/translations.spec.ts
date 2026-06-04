import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'nl', 'cn', 'ar'] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const translationsDir = join(process.cwd(), 'translations');

const isTranslationTree = (value: unknown): value is TranslationTree =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readTranslation = (locale: SupportedLocale): TranslationTree => {
  const parsed = JSON.parse(
    readFileSync(join(translationsDir, `${locale}.json`), 'utf8')
  ) as unknown;

  if (!isTranslationTree(parsed)) {
    throw new TypeError(`${locale}.json must contain a translation object`);
  }

  return parsed;
};

const flattenTranslation = (tree: TranslationTree, prefix = ''): Record<string, string> => {
  return Object.entries(tree).reduce<Record<string, string>>((flattened, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      flattened[path] = value;
      return flattened;
    }

    if (!isTranslationTree(value)) {
      throw new TypeError(`Translation key "${path}" must be a string or nested object`);
    }

    return {
      ...flattened,
      ...flattenTranslation(value, path)
    };
  }, {});
};

const extractInterpolationVariables = (translation: string): string[] => {
  const variables = new Set<string>();
  const interpolationPattern = /\{\{\s*([^}]+?)\s*\}\}/g;

  for (const match of translation.matchAll(interpolationPattern)) {
    const variable = match[1];

    if (variable) {
      variables.add(variable.trim());
    }
  }

  return [...variables].sort();
};

const translations = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, flattenTranslation(readTranslation(locale))])
) as Record<SupportedLocale, Record<string, string>>;

describe('translation files', () => {
  it('keeps the bundled locale files aligned with the app configuration', () => {
    const localeFiles = readdirSync(translationsDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => basename(file, '.json'))
      .sort();

    expect(localeFiles).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it.each(SUPPORTED_LOCALES)('%s.json contains only non-empty string leaves', (locale) => {
    expect(Object.keys(translations[locale]).length).toBeGreaterThan(0);

    for (const [key, value] of Object.entries(translations[locale])) {
      expect(key).not.toBe('');
      expect(value.trim()).not.toBe('');
    }
  });

  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== 'en'))(
    '%s.json preserves interpolation variables for translated overrides',
    (locale) => {
      for (const [key, translation] of Object.entries(translations[locale])) {
        const englishTranslation = translations.en[key];

        if (!englishTranslation) {
          continue;
        }

        expect(extractInterpolationVariables(translation)).toEqual(
          extractInterpolationVariables(englishTranslation)
        );
      }
    }
  );
});
