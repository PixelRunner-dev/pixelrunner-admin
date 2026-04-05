const ATTR_DISABLED = 'disabled';
const CLASS_HIDDEN = 'is-hidden';

type Direction = 'horizontal' | 'vertical';

type CarouselOptions = {
  container: HTMLElement;

  direction?: Direction | null;
  autoplayTimer?: number | null;
  styleClasses?: Partial<CarouselStyleClasses> | null;
};

type CarouselStyleClasses = {
  isInitialized: string;
  hasNoScroll: string;
  isPrevButtonVisible: string;
  isNextButtonVisible: string;
  pagination: string;
  page: string;
  isCurrentPage: string;
};

export class Carousel {
  private container: HTMLElement;
  private track: HTMLElement;
  private pagination: HTMLElement | null;
  private prevButton: HTMLButtonElement | null;
  private nextButton: HTMLButtonElement | null;
  private autoplayTimer: number;
  private isDirectionHorizontal: boolean;
  private autoplayInterval: ReturnType<typeof setInterval> | null;
  private scrollEndSensitivity: number;
  private currentPageIndex: number;
  private stylesClass: CarouselStyleClasses;
  private isCallInNextFrameRequested: boolean;
  private isScrollStart: boolean;
  private isScrollEnd: boolean;
  private hasScroll: boolean;
  private boundStartAutoSlide: (() => void) | null;

  constructor(options: CarouselOptions) {
    this.container = options.container;
    this.track = this.container.querySelector<HTMLElement>('.carousel__track')!;
    this.pagination = this.container.querySelector<HTMLElement>('.pagination') || null;
    this.prevButton = this.container.querySelector<HTMLButtonElement>('[data-action="prev"]');
    this.nextButton = this.container.querySelector<HTMLButtonElement>('[data-action="next"]');
    this.autoplayTimer = (options.autoplayTimer ?? 0) * 1000;

    this.isDirectionHorizontal = options.direction !== 'vertical';
    this.currentPageIndex = 0;
    this.autoplayInterval = null;
    this.scrollEndSensitivity = 40;

    this.isCallInNextFrameRequested =
      this.isScrollStart =
      this.isScrollEnd =
      this.hasScroll =
        false;

    this.boundStartAutoSlide = null;

    this.stylesClass = {
      isInitialized: options.styleClasses?.isInitialized || 'is-initialized',
      hasNoScroll: options.styleClasses?.hasNoScroll || 'has-no-scroll',
      isPrevButtonVisible: options.styleClasses?.isPrevButtonVisible || 'is-prev-button-visible',
      isNextButtonVisible: options.styleClasses?.isNextButtonVisible || 'is-next-button-visible',
      pagination: options.styleClasses?.pagination || 'pagination',
      page: options.styleClasses?.page || 'page',
      isCurrentPage: options.styleClasses?.isCurrentPage || 'is-current-page'
    };

    this.init();
  }

  init() {
    this.addEventListeners();
    this.onScroll();
    this.syncPrevNextButtons();
    this.initPagination();
    this.setActivePagination(this.getCurrentPageIndex());

    if (this.autoplayTimer > 0) {
      this.initAutoSlide();
    }

    this.container.classList.add(this.stylesClass.isInitialized);
  }

  addEventListeners() {
    this.onScroll = this.onScroll.bind(this);
    this.scrollBackward = this.scrollBackward.bind(this);
    this.scrollForward = this.scrollForward.bind(this);
    this.resetAutoSlide = this.resetAutoSlide.bind(this);

    this.track.addEventListener('scroll', this.onScroll, { passive: true });
    this.track.addEventListener('touchstart', this.onScroll, { passive: true });

    if (this.prevButton) this.prevButton.addEventListener('click', this.scrollBackward);
    if (this.nextButton) this.nextButton.addEventListener('click', this.scrollForward);
  }

  removeEventListeners() {
    this.track.removeEventListener('scroll', this.onScroll);
    this.track.removeEventListener('touchstart', this.onScroll);

    this.track.removeEventListener('touchstart', this.resetAutoSlide);
    this.track.removeEventListener('mouseenter', this.resetAutoSlide);
    if (this.boundStartAutoSlide)
      this.track.removeEventListener('mouseleave', this.boundStartAutoSlide);

    if (this.prevButton) this.prevButton.removeEventListener('click', this.scrollBackward);
    if (this.nextButton) this.nextButton.removeEventListener('click', this.scrollForward);
  }

  // Prev next buttons and UI
  onScroll() {
    this.getScrollState();

    if (!this.isCallInNextFrameRequested) {
      window.requestAnimationFrame(this.scrollHandlers.bind(this));
      this.isCallInNextFrameRequested = true;
    }
  }

  getScrollState() {
    // Possible optimization: Resize Observer that watch carousel width and cache this.carousel.offsetWidth
    if (this.isDirectionHorizontal) {
      const totalScrollWidth = Math.round(this.track.scrollLeft + this.container.offsetWidth);
      this.isScrollStart = this.track.scrollLeft <= 0;
      this.isScrollEnd = totalScrollWidth + this.scrollEndSensitivity >= this.track.scrollWidth;
    } else {
      const totalScrollHeight = Math.round(this.track.scrollTop + this.container.offsetHeight);
      this.isScrollStart = this.track.scrollTop <= 0;
      this.isScrollEnd = totalScrollHeight + this.scrollEndSensitivity >= this.track.scrollHeight;
    }
  }

  scrollHandlers() {
    this.syncPrevNextButtons();
    this.updateCurrentPageIndex();
    this.isCallInNextFrameRequested = false;
  }

  updateCurrentPageIndex() {
    const requestedPageIndex = Math.round(this.track.scrollLeft / this.container.clientWidth);
    if (this.currentPageIndex === requestedPageIndex) {
      return;
    }

    this.setActivePagination(requestedPageIndex);

    this.currentPageIndex = requestedPageIndex;
    this.container.dispatchEvent(
      new CustomEvent('Carousel:pageChanged', {
        bubbles: false,
        detail: this.currentPageIndex
      })
    );
  }

  syncPrevNextButtons() {
    if (this.isScrollStart && this.isScrollEnd) {
      // No scroll case
      this.container.classList.add(this.stylesClass.hasNoScroll);
      this.hasScroll = false;
    } else {
      this.container.classList.remove(this.stylesClass.hasNoScroll);
      this.hasScroll = true;
    }

    if (this.isScrollStart) {
      this.container.classList.remove(this.stylesClass.isPrevButtonVisible);
      if (this.prevButton) this.prevButton.setAttribute(ATTR_DISABLED, ATTR_DISABLED);
    } else {
      this.container.classList.add(this.stylesClass.isPrevButtonVisible);
      if (this.prevButton) this.prevButton.removeAttribute(ATTR_DISABLED);
    }

    if (this.isScrollEnd) {
      this.container.classList.remove(this.stylesClass.isNextButtonVisible);
      if (this.nextButton) this.nextButton.setAttribute(ATTR_DISABLED, ATTR_DISABLED);
    } else {
      this.container.classList.add(this.stylesClass.isNextButtonVisible);
      if (this.nextButton) this.nextButton.removeAttribute(ATTR_DISABLED);
    }

    if (this.isScrollStart && this.isScrollEnd && this.prevButton && this.nextButton) {
      this.prevButton.classList.add(CLASS_HIDDEN);
      this.nextButton.classList.add(CLASS_HIDDEN);
    }
  }

  // Prev next functionality

  // relative scroll - page by page
  scrollBackward() {
    this.scrollByPage(false);
  }

  scrollForward() {
    this.scrollByPage(true);
  }

  scrollByPage(isNext: boolean) {
    const x = this.isDirectionHorizontal ? this.track.clientWidth : 0;
    const y = this.isDirectionHorizontal ? 0 : this.track.clientHeight;

    if (isNext) {
      this.track.scrollBy(x, y);
    } else {
      this.track.scrollBy(-x, -y);
    }
  }

  // abs scroll - page to page
  getCurrentPageIndex() {
    const currentPosition = this.isDirectionHorizontal
      ? this.track.scrollLeft
      : this.track.scrollTop;
    const pageWidth = this.isDirectionHorizontal ? this.track.clientWidth : this.track.clientHeight;
    return Math.round(currentPosition / pageWidth);
  }

  scrollToNextPage() {
    this.scrollToPage(this.getCurrentPageIndex() + 1);
  }

  scrollToPrevPage() {
    this.scrollToPage(this.getCurrentPageIndex() - 1);
  }

  scrollToPage(pageIndex: number) {
    if (pageIndex < 0) {
      return;
    }

    if (this.isDirectionHorizontal) {
      this.scrollToPoint(0, Math.round(this.container.clientWidth * pageIndex));
    } else {
      this.scrollToPoint(Math.round(this.container.clientHeight * pageIndex), 0);
    }
  }

  scrollToPoint(top: number, left: number) {
    const element = this.track;
    // Safari and Edge do not have smooth scrolling please use polyfill or just leave it as is
    // If you still using jQuery you could call $.animate()
    if (
      typeof element.scrollTo === 'function' &&
      'scrollBehavior' in document.documentElement.style
    ) {
      element.scrollTo({
        top: top,
        left: left,
        behavior: 'smooth'
      });
    } else {
      if (this.isDirectionHorizontal) {
        element.scrollLeft = left;
      } else {
        element.scrollTop = top;
      }
    }
  }

  // Pagination

  initPagination() {
    if (!this.container.hasAttribute('data-pagination')) {
      return;
    }
    this.createPagination();
    this.updateCurrentPageIndex();
  }

  createPagination() {
    const hasPagination = !!this.pagination;
    // We need to use round, not ceil, since it called on scroll, in case of last it would generate false positive
    const numberOfPages = Math.round(this.track.scrollWidth / this.track.clientWidth);

    if (!hasPagination) {
      this.pagination = document.createElement('div');
      this.pagination.className = this.stylesClass.pagination;
    } else {
      this.container.removeChild(this.pagination!);
    }

    for (let i = 0; i < numberOfPages; i++) {
      const page = document.createElement('div');
      page.className = this.stylesClass.page;
      page.setAttribute('data-page', i.toString());
      this.pagination!.appendChild(page);
    }

    if (!hasPagination) {
      this.track.after(this.pagination!);
    }
  }

  setActivePagination(requestedPageIndex: number) {
    if (!this.pagination) return;

    const pages = this.pagination.children;
    const currentPage = pages[this.currentPageIndex] as HTMLElement;
    const requestedPage = pages[requestedPageIndex] as HTMLElement;
    if (currentPage) currentPage.classList.remove(this.stylesClass.isCurrentPage);
    if (requestedPage) requestedPage.classList.add(this.stylesClass.isCurrentPage);
  }

  destroyPagination() {
    if (!this.pagination) return;
    this.container.removeChild(this.pagination);
    // delete this.pagination;
    this.pagination = null;
  }

  // Timer

  initAutoSlide() {
    this.track.addEventListener('touchstart', this.resetAutoSlide, { passive: true });
    this.track.addEventListener('mouseenter', this.resetAutoSlide);
    this.boundStartAutoSlide = this.startAutoSlide.bind(this);
    this.track.addEventListener('mouseleave', this.boundStartAutoSlide);
    this.startAutoSlide();
  }

  startAutoSlide() {
    this.resetAutoSlide();
    this.autoplayInterval = setInterval(() => {
      if (this.isScrollEnd) {
        this.scrollToPage(0);
      } else {
        this.scrollToNextPage();
      }
    }, this.autoplayTimer);
  }

  resetAutoSlide() {
    if (this.autoplayInterval) clearInterval(this.autoplayInterval);
  }

  destroy() {
    this.removeEventListeners();
    this.destroyPagination();
    this.resetAutoSlide();
  }
}
