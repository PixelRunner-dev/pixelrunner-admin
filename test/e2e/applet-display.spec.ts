import { test, expect } from '@playwright/test';

async function goToApplets(page: import('@playwright/test').Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
}

function getAppletCard(page: import('@playwright/test').Page, packageName: string) {
  return page.locator(`[data-testid="applet-card"][data-applet-package-name="${packageName}"]`);
}

async function goToLibrary(page: import('@playwright/test').Page) {
  await page.goto('/library');
  await expect(page.locator('.component--carousel').first()).toBeVisible({ timeout: 15000 });
}

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
    await goToLibrary(page);
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
    await goToLibrary(page);
    const carousel = page.locator('.component--carousel').first();
    const prevButton = carousel.locator('button[data-action="prev"]');
    const nextButton = carousel.locator('button[data-action="next"]');
    const isCoarsePointer = await page.evaluate(
      () => window.matchMedia('(pointer: coarse)').matches
    );

    await expect(carousel).toBeVisible();
    await expect(carousel.locator('.carousel__track')).toBeVisible();
    await expect(prevButton).toHaveCount(1);
    await expect(nextButton).toHaveCount(1);
    await expect(prevButton).toHaveClass(/pointer-coarse:hidden/);
    await expect(nextButton).toHaveClass(/pointer-coarse:hidden/);

    if (isCoarsePointer) {
      await expect(prevButton).toBeHidden();
      await expect(nextButton).toBeHidden();
    } else {
      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
  });

  test('carousel contains applet cards', async ({ page }) => {
    await goToLibrary(page);
    const carousel = page.locator('.component--carousel').first();
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('article.component--applet-card').first()).toBeVisible();
  });

  test('wide variant applies wider item class', async ({ page }) => {
    await goToLibrary(page);
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
    await goToApplets(page);
    const details = page.getByTestId('applet-details').first();
    await expect(details).toBeVisible();
    await expect(details).toHaveAttribute('data-view', 'horizontal');
    await expect(details.locator('h2[data-testid="applet-details-title"]')).toBeVisible();
    await expect(details.locator('h1[data-testid="applet-details-title"]')).toHaveCount(0);
    await expect(details.locator('h3[data-testid="applet-details-title"]')).toHaveCount(0);
    await expect(details.getByTestId('applet-details-author')).toHaveCount(1);
  });

  test('renders h1 with author and description in full-detail view', async ({ page }) => {
    await goToApplets(page);
    await getAppletCard(page, 'clockbyhenry').getByTestId('applet-configure-link').click();
    await page.waitForURL(/\/applets\/.+/);

    const details = page.locator('[data-testid="applet-details"][data-view="full-detail"]');
    await expect(details).toHaveAttribute('data-view', 'full-detail');
    await expect(details.locator('h1[data-testid="applet-details-title"]')).toBeVisible();
    await expect(details.locator('h2[data-testid="applet-details-title"]')).toHaveCount(0);
    await expect(details.locator('h3[data-testid="applet-details-title"]')).toHaveCount(0);
    await expect(details.getByTestId('applet-details-author')).toBeVisible();
    await expect(details.getByTestId('applet-details-summary')).toBeVisible();
    await expect(details.getByTestId('applet-details-description')).toBeVisible();
  });

  test('renders h3 titles for preview and vertical applet cards', async ({ page }) => {
    await goToLibrary(page);
    const previewDetails = page
      .locator('[data-testid="applet-details"][data-view="preview"]')
      .first();
    const verticalDetails = page
      .locator('[data-testid="applet-details"][data-view="vertical"]')
      .first();

    await expect(previewDetails.locator('h3[data-testid="applet-details-title"]')).toBeVisible();
    await expect(verticalDetails.locator('h3[data-testid="applet-details-title"]')).toBeVisible();
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
    await goToApplets(page);
    const items = page.locator('.component--playlist li.draggable-applet');
    await expect(items.first().locator('article.component--applet-card')).toBeVisible();
    await expect(items.first().getByTestId('applet-configure-link')).toBeVisible();
  });
});
