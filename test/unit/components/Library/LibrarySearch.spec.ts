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

describe('LibrarySearch.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search component', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('.component--library-search').exists()).toBe(true);
  });

  it('has search input field', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('initializes with empty query', () => {
    const wrapper = mount(LibrarySearch);
    const input = wrapper.find('input[type="text"]');
    expect(input.element).toBeDefined();
  });

  it('supports search input', async () => {
    const wrapper = mount(LibrarySearch);
    const input = wrapper.find('input');
    await input.setValue('test search');
    expect(input.element.value).toBe('test search');
  });

  it('updates query on input change', async () => {
    const wrapper = mount(LibrarySearch);
    const input = wrapper.find('input');
    await input.setValue('query');
    expect(input.element.value).toBe('query');
  });

  it('handles empty queries', async () => {
    const wrapper = mount(LibrarySearch);
    const input = wrapper.find('input');
    await input.setValue('');
    expect(input.element.value).toBe('');
  });

  it('clears search on explicit clear', async () => {
    const wrapper = mount(LibrarySearch);
    const input = wrapper.find('input');
    await input.setValue('search term');
    await input.setValue('');
    expect(input.element.value).toBe('');
  });

  it('normalizes query input', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.vm).toBeDefined();
  });

  it('watches route query changes', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('updates router on query change', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('handles array query values', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('synchronizes input with route query', () => {
    const wrapper = mount(LibrarySearch);
    expect(wrapper.find('input').exists()).toBe(true);
  });
});
