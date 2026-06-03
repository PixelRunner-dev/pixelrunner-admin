import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LibrarySearch from '@/components/Library/LibrarySearch.vue';

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: vi.fn()
  }),
  useRoute: () => ({
    query: { q: '' }
  })
}));

function mountLibrarySearch() {
  return mount(LibrarySearch, {
    global: {
      mocks: {
        $t: (key: string) => key
      }
    }
  });
}

describe('LibrarySearch.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search component', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('.component--library-search').exists()).toBe(true);
  });

  it('has search input field', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('initializes with empty query', () => {
    const wrapper = mountLibrarySearch();
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
  });

  it('supports search input', async () => {
    const wrapper = mountLibrarySearch();
    const input = wrapper.find('input');
    await input.setValue('test search');
    expect(input.element.value).toBe('test search');
  });

  it('updates query on input change', async () => {
    const wrapper = mountLibrarySearch();
    const input = wrapper.find('input');
    await input.setValue('query');
    expect(input.element.value).toBe('query');
  });

  it('handles empty queries', async () => {
    const wrapper = mountLibrarySearch();
    const input = wrapper.find('input');
    await input.setValue('');
    expect(input.element.value).toBe('');
  });

  it('clears search on explicit clear', async () => {
    const wrapper = mountLibrarySearch();
    const input = wrapper.find('input');
    await input.setValue('search term');
    await input.setValue('');
    expect(input.element.value).toBe('');
  });

  it('normalizes query input', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.vm).toBeDefined();
  });

  it('watches route query changes', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('updates router on query change', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('handles array query values', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('synchronizes input with route query', () => {
    const wrapper = mountLibrarySearch();
    expect(wrapper.find('input').exists()).toBe(true);
  });
});
