import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Carousel } from '@/adapters/CarouselAdapter.ts';

describe('CarouselAdapter', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('initializes a horizontal carousel without scroll and hides both controls', () => {
    const { container, nextButton, prevButton } = createCarouselDom({
      clientWidth: 320,
      offsetWidth: 320,
      scrollWidth: 320
    });

    new Carousel({ container });

    expect(container.classList.contains('is-initialized')).toBe(true);
    expect(container.classList.contains('has-no-scroll')).toBe(true);
    expect(container.classList.contains('is-prev-button-visible')).toBe(false);
    expect(container.classList.contains('is-next-button-visible')).toBe(false);
    expect(prevButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);
    expect(prevButton.classList.contains('is-hidden')).toBe(true);
    expect(nextButton.classList.contains('is-hidden')).toBe(true);
  });

  it('syncs horizontal scroll button state and scrolls page by page', () => {
    const { container, nextButton, prevButton, track } = createCarouselDom({
      clientWidth: 320,
      offsetWidth: 320,
      scrollLeft: 160,
      scrollWidth: 960
    });
    const carousel = new Carousel({ container });

    expect(container.classList.contains('has-no-scroll')).toBe(false);
    expect(container.classList.contains('is-prev-button-visible')).toBe(true);
    expect(container.classList.contains('is-next-button-visible')).toBe(true);
    expect(prevButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(false);

    nextButton.click();
    prevButton.click();

    expect(track.scrollBy).toHaveBeenNthCalledWith(1, 320, 0);
    expect(track.scrollBy).toHaveBeenNthCalledWith(2, -320, -0);

    carousel.destroy();
    nextButton.click();
    expect(track.scrollBy).toHaveBeenCalledTimes(2);
  });

  it('uses vertical geometry for scroll state and page movement', () => {
    const { container, track } = createCarouselDom({
      clientHeight: 240,
      offsetHeight: 240,
      scrollHeight: 720,
      scrollTop: 240
    });
    const carousel = new Carousel({ container, direction: 'vertical' });

    expect(container.classList.contains('is-prev-button-visible')).toBe(true);
    expect(container.classList.contains('is-next-button-visible')).toBe(true);

    carousel.scrollByPage(true);
    carousel.scrollByPage(false);
    carousel.scrollToPage(2);
    carousel.scrollToPage(-1);

    expect(track.scrollBy).toHaveBeenNthCalledWith(1, 0, 240);
    expect(track.scrollBy).toHaveBeenNthCalledWith(2, -0, -240);
    expect(track.scrollTo).toHaveBeenCalledWith({ top: 480, left: 0, behavior: 'smooth' });
    expect(track.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('falls back to direct scroll offsets when smooth scroll is unavailable', () => {
    const { container, track } = createCarouselDom({
      clientWidth: 320,
      offsetWidth: 320,
      scrollWidth: 960
    });
    Object.defineProperty(document.documentElement, 'style', {
      configurable: true,
      value: {}
    });
    Object.defineProperty(track, 'scrollTo', {
      configurable: true,
      value: undefined
    });
    const carousel = new Carousel({ container });

    carousel.scrollToPage(2);

    expect(track.scrollLeft).toBe(640);
  });

  it('reuses, refreshes, activates, and destroys existing pagination', () => {
    const { container, pagination, track } = createCarouselDom({
      withPagination: true,
      existingPagination: true,
      clientWidth: 200,
      offsetWidth: 200,
      scrollWidth: 600
    });
    const removedPages = pagination.children.length;
    const carousel = new Carousel({
      container,
      styleClasses: {
        pagination: 'dots',
        page: 'dot',
        isCurrentPage: 'active-dot'
      }
    });

    const generatedPagination = container.querySelector('.pagination');
    if (!generatedPagination) throw new Error('Pagination was not created');
    expect(removedPages).toBe(1);
    expect(generatedPagination).toBe(pagination);
    expect(generatedPagination?.children).toHaveLength(3);
    expect(generatedPagination.children[0]?.classList.contains('active-dot')).toBe(true);

    const pageChanged = vi.fn();
    container.addEventListener('Carousel:pageChanged', pageChanged);
    carousel.scrollHandlers();
    setElementMetrics(track, { scrollLeft: 410 });
    track.dispatchEvent(new Event('scroll'));

    expect(pageChanged).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 2, bubbles: false })
    );
    expect(generatedPagination.children[2]?.classList.contains('active-dot')).toBe(true);

    carousel.destroy();
    expect(container.querySelector('.dots')).toBeNull();
  });

  it('skips pagination when the container has no pagination opt-in', () => {
    const { container } = createCarouselDom({
      clientWidth: 200,
      offsetWidth: 200,
      scrollWidth: 600
    });

    const carousel = new Carousel({ container });

    expect(container.querySelector('.pagination')).toBeNull();
    expect(() => carousel.destroy()).not.toThrow();
  });

  it('auto-slides forward, wraps at scroll end, resets, and removes timer listeners', () => {
    vi.useFakeTimers();
    const { container, track } = createCarouselDom({
      clientWidth: 200,
      offsetWidth: 200,
      scrollWidth: 600
    });
    const carousel = new Carousel({ container, autoplayTimer: 1 });

    vi.advanceTimersByTime(1000);
    expect(track.scrollTo).toHaveBeenCalledWith({ top: 0, left: 200, behavior: 'smooth' });

    setElementMetrics(track, { scrollLeft: 560 });
    track.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(1000);

    expect(track.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });

    carousel.destroy();
    vi.clearAllTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('throws when required track markup is missing', () => {
    const container = document.createElement('section');

    expect(() => new Carousel({ container })).toThrow();
  });
});

type CarouselDomOptions = {
  clientHeight?: number;
  clientWidth?: number;
  existingPagination?: boolean;
  offsetHeight?: number;
  offsetWidth?: number;
  scrollHeight?: number;
  scrollLeft?: number;
  scrollTop?: number;
  scrollWidth?: number;
  withPagination?: boolean;
};

function createCarouselDom(options: CarouselDomOptions = {}) {
  const container = document.createElement('section');
  const track = document.createElement('div');
  const prevButton = document.createElement('button');
  const nextButton = document.createElement('button');

  container.className = 'carousel';
  track.className = 'carousel__track';
  prevButton.dataset.action = 'prev';
  nextButton.dataset.action = 'next';

  if (options.withPagination) container.setAttribute('data-pagination', '');

  container.append(prevButton, track, nextButton);

  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  pagination.append(document.createElement('div'));
  if (options.existingPagination) container.append(pagination);

  document.body.append(container);
  setElementMetrics(container, {
    clientHeight: options.clientHeight ?? 200,
    clientWidth: options.clientWidth ?? 300,
    offsetHeight: options.offsetHeight ?? 200,
    offsetWidth: options.offsetWidth ?? 300
  });
  setElementMetrics(track, {
    clientHeight: options.clientHeight ?? 200,
    clientWidth: options.clientWidth ?? 300,
    scrollHeight: options.scrollHeight ?? options.clientHeight ?? 200,
    scrollLeft: options.scrollLeft ?? 0,
    scrollTop: options.scrollTop ?? 0,
    scrollWidth: options.scrollWidth ?? options.clientWidth ?? 300
  });

  Object.defineProperty(document.documentElement.style, 'scrollBehavior', {
    configurable: true,
    value: ''
  });
  Object.defineProperty(track, 'scrollBy', {
    configurable: true,
    value: vi.fn()
  });
  Object.defineProperty(track, 'scrollTo', {
    configurable: true,
    value: vi.fn()
  });

  return {
    container,
    nextButton,
    pagination,
    prevButton,
    track: track as unknown as HTMLElement & {
      scrollBy: ReturnType<typeof vi.fn>;
      scrollTo: ReturnType<typeof vi.fn>;
    }
  };
}

function setElementMetrics(
  element: HTMLElement,
  metrics: Partial<
    Pick<
      HTMLElement,
      | 'clientHeight'
      | 'clientWidth'
      | 'offsetHeight'
      | 'offsetWidth'
      | 'scrollHeight'
      | 'scrollLeft'
      | 'scrollTop'
      | 'scrollWidth'
    >
  >
) {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, {
      configurable: true,
      value,
      writable: key === 'scrollLeft' || key === 'scrollTop'
    });
  }
}
