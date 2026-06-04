import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SetLanguage from '@/components/SetLanguage.vue';

const languageMock = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  i18next: {
    language: 'en',
    options: {
      resources: {
        en: {},
        nl: {},
        de: {},
        ar: {}
      } as Record<string, unknown> | undefined,
      supportedLngs: undefined as string[] | undefined
    }
  }
}));

vi.mock('i18next', () => ({
  changeLanguage: languageMock.changeLanguage,
  default: languageMock.i18next
}));

vi.mock('@/utils/CookieStore.ts', () => ({
  CookieStore: {
    get: languageMock.cookieGet,
    set: languageMock.cookieSet
  }
}));

describe('SetLanguage', () => {
  beforeEach(() => {
    languageMock.changeLanguage.mockReset();
    languageMock.cookieGet.mockReset();
    languageMock.cookieSet.mockReset();
    languageMock.cookieGet.mockReturnValue(null);
    languageMock.i18next.language = 'en';
    languageMock.i18next.options.resources = {
      en: {},
      nl: {},
      de: {},
      ar: {}
    };
    languageMock.i18next.options.supportedLngs = undefined;
  });

  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    vi.restoreAllMocks();
  });

  it('renders language options from i18next resources with default id, name and current value', () => {
    const wrapper = mountLanguage();
    const select = wrapper.get('select');
    const options = wrapper.findAll('option');

    expect(select.attributes('id')).toBe('language');
    expect(select.attributes('name')).toBe('language');
    expect((select.element as HTMLSelectElement).value).toBe('en');
    expect(options.map((option) => option.attributes('value'))).toEqual(['en', 'nl', 'de', 'ar']);
    expect(options).toHaveLength(4);
  });

  it('renders language options from supported languages when resources are lazy loaded', () => {
    languageMock.i18next.options.resources = { en: {} };
    languageMock.i18next.options.supportedLngs = ['en', 'nl', 'de', 'ar'];

    const wrapper = mountLanguage();

    expect(wrapper.findAll('option').map((option) => option.attributes('value'))).toEqual([
      'en',
      'nl',
      'de',
      'ar'
    ]);
  });

  it('prefers modelValue over cookie and i18next fallback values', () => {
    languageMock.cookieGet.mockReturnValue('nl');
    languageMock.i18next.language = 'de';

    const wrapper = mountLanguage({ modelValue: 'en' });

    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('en');
    expect(wrapper.vm.getCurrentLanguage().value).toBe('en');
  });

  it('uses the stored cookie language before falling back to i18next language', () => {
    languageMock.cookieGet.mockReturnValue('nl');
    languageMock.i18next.language = 'de';

    const cookieWrapper = mountLanguage();

    expect((cookieWrapper.get('select').element as HTMLSelectElement).value).toBe('nl');

    languageMock.cookieGet.mockReturnValue(null);
    const fallbackWrapper = mountLanguage();

    expect((fallbackWrapper.get('select').element as HTMLSelectElement).value).toBe('de');
  });

  it('falls back to English when neither cookie nor i18next language is available', () => {
    languageMock.cookieGet.mockReturnValue(null);
    languageMock.i18next.language = '';

    const wrapper = mountLanguage();

    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('en');
    expect(wrapper.vm.getCurrentLanguage().value).toBe('en');
  });

  it('renders a required disabled placeholder and empty value when selection is required', () => {
    languageMock.cookieGet.mockReturnValue(null);
    languageMock.i18next.language = '';
    const wrapper = mountLanguage({
      id: 'setup-language',
      name: 'setupLanguage',
      requireSelection: true
    });
    const select = wrapper.get('select');
    const options = wrapper.findAll('option');

    expect(select.attributes('id')).toBe('setup-language');
    expect(select.attributes('name')).toBe('setupLanguage');
    expect((select.element as HTMLSelectElement).value).toBe('');
    expect(options[0]?.attributes()).toEqual(
      expect.objectContaining({
        disabled: '',
        value: ''
      })
    );
  });

  it('updates internal state when the model value prop changes to a defined new value', async () => {
    const wrapper = mountLanguage({ modelValue: 'en' });

    await wrapper.setProps({ modelValue: 'nl' });

    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('nl');
    expect(wrapper.vm.getCurrentLanguage().value).toBe('nl');

    await wrapper.setProps({ modelValue: undefined });

    expect(wrapper.vm.getCurrentLanguage().value).toBe('nl');

    await wrapper.setProps({ modelValue: 'nl' });

    expect(wrapper.vm.getCurrentLanguage().value).toBe('nl');
  });

  it('applies selected language, persists the cookie and emits update events', async () => {
    const wrapper = mountLanguage({ modelValue: 'en' });
    const select = wrapper.get('select');

    await select.setValue('nl');

    expect(languageMock.changeLanguage).toHaveBeenCalledWith('nl');
    expect(languageMock.cookieSet).toHaveBeenCalledWith('language', 'nl');
    expect(wrapper.emitted('update:modelValue')).toEqual([['nl']]);
    expect(wrapper.emitted('change')).toEqual([['nl']]);
    expect(wrapper.vm.getCurrentLanguage().value).toBe('nl');
  });

  it('sets the document direction from the selected language', async () => {
    const wrapper = mountLanguage({ modelValue: 'en' });
    const select = wrapper.get('select');

    expect(document.documentElement.getAttribute('dir')).toBe('ltr');

    await select.setValue('ar');

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');

    await select.setValue('nl');

    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('ignores empty changes and supports missing resource maps', async () => {
    languageMock.i18next.options.resources = undefined;
    const wrapper = mountLanguage({ requireSelection: true });
    const select = wrapper.get('select');

    expect(wrapper.findAll('option')).toHaveLength(1);

    await select.trigger('change');

    expect(languageMock.changeLanguage).not.toHaveBeenCalled();
    expect(languageMock.cookieSet).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.vm.getCurrentLanguage().value).toBe('');
  });
});

function mountLanguage(props: Partial<InstanceType<typeof SetLanguage>['$props']> = {}) {
  return mount(SetLanguage, {
    props,
    global: {
      mocks: {
        $t: (key: string) => `t:${key}`
      }
    }
  });
}
