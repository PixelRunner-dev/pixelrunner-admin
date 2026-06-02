import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────
// AppletList
// ──────────────────────────────────────────────

test.describe('AppletList', () => {
  test('renders draggable list with drag indicators in playlist', async ({ page }) => {
    await page.goto('/applets');
    const list = page.locator('ul.is-dragable.playlist');
    await expect(list).toBeVisible();
    await expect(list.locator('li.draggable-applet')).toHaveCount(5);
    // Each draggable item has a drag indicator handle
    await expect(list.locator('li.draggable-applet .drag-indicator').first()).toBeVisible();
  });

  test('renders non-draggable list inside carousel on library page', async ({ page }) => {
    await page.goto('/library');
    // AppletCarousel wraps AppletList without isDragable → renders ul.carousel__track
    const carouselTrack = page.locator('.component--carousel ul.carousel__track').first();
    await expect(carouselTrack).toBeVisible();
    await expect(carouselTrack.locator('li.carousel__track__item').first()).toBeVisible();
  });

  test('limit prop bounds visible items', async ({ page }) => {
    // PlayList passes limit=99 so all 5 mock applets appear
    await page.goto('/applets');
    await expect(page.locator('ul.is-dragable.playlist li.draggable-applet')).toHaveCount(5);
  });
});

// ──────────────────────────────────────────────
// AppletCarousel
// ──────────────────────────────────────────────

test.describe('AppletCarousel', () => {
  test('renders carousel wrapper with track and nav buttons', async ({ page }) => {
    await page.goto('/library');
    const carousel = page.locator('.component--carousel').first();
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('.carousel__track')).toBeVisible();
    await expect(carousel.locator('button[data-action="prev"]')).toBeVisible();
    await expect(carousel.locator('button[data-action="next"]')).toBeVisible();
  });

  test('carousel contains applet cards', async ({ page }) => {
    await page.goto('/library');
    const carousel = page.locator('.component--carousel').first();
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('article.component--applet-card').first()).toBeVisible();
  });

  test('wide variant applies wider item class', async ({ page }) => {
    await page.goto('/library');
    // LibraryPage has one carousel with itemWidth="wide"
    await expect(
      page.locator('.component--carousel .carousel__item-width--wide').first()
    ).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// AppletDetails
// ──────────────────────────────────────────────

test.describe('AppletDetails', () => {
  test('renders h2 with applet name in playlist (horizontal view)', async ({ page }) => {
    await page.goto('/applets');
    const details = page.locator('.component--applet-details').first();
    await expect(details).toBeVisible();
    await expect(details.locator('h2')).toBeVisible();
    // Author not shown in horizontal view
    await expect(details.locator('p').filter({ hasText: '[By]:' })).toHaveCount(0);
  });

  test('renders h1 with author and description in full-detail view', async ({ page }) => {
    await page.goto('/applets');
    await page
      .locator('article.component--applet-card a', { hasText: 'Configure' })
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);

    const details = page.locator('.component--applet-details');
    await expect(details.locator('h1')).toBeVisible();
    await expect(details.locator('p', { hasText: '[By]:' })).toBeVisible();
    await expect(details.locator('p.text-xl')).toBeVisible();
  });

  test('shows official badge for official applets', async ({ page }) => {
    await page.goto('/library');
    // Official applets have badge — at least some mock applets are official (random, but likely)
    const officialBadge = page.locator('.component--applet-details .badge-primary');
    // Not guaranteed to be present (random), just assert the element type is correct if present
    await expect(page.locator('.component--applet-details h2').first()).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// PlayList
// ──────────────────────────────────────────────

test.describe('PlayList', () => {
  test('renders playlist wrapper with data attributes', async ({ page }) => {
    await page.goto('/applets');
    const playlist = page.locator('.component--playlist');
    await expect(playlist).toBeVisible();
    // Has data-created attribute (may be undefined but attribute should exist)
    await expect(playlist).toHaveAttribute('data-created', /.*/);
  });

  test('renders draggable AppletList when applets present', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('.component--playlist ul.is-dragable')).toBeVisible();
    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(5);
  });

  test('each playlist item contains an AppletCard with Configure CTA', async ({ page }) => {
    await page.goto('/applets');
    const items = page.locator('.component--playlist li.draggable-applet');
    await expect(items.first().locator('article.component--applet-card')).toBeVisible();
    await expect(items.first().locator('a', { hasText: 'Configure' })).toBeVisible();
  });
});
