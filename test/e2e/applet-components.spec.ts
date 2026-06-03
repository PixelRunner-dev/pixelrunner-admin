import { test, expect } from '@playwright/test';

async function goToApplets(page: import('@playwright/test').Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
}

function getAppletCard(page: import('@playwright/test').Page, packageName: string) {
  return page.locator(`[data-testid="applet-card"][data-applet-package-name="${packageName}"]`);
}

test.describe('AppletImage', () => {
  test('renders without frame in playlist', async ({ page }) => {
    await page.goto('/applets');
    const container = page.locator('.component--applet-image').first();
    await expect(container).toBeVisible();
    await expect(container).not.toHaveClass(/is-showing-frame/);
    await expect(container.locator('img.applet-image')).toBeVisible();
  });

  test('renders with frame on applet detail page', async ({ page }) => {
    await goToApplets(page);
    await page.getByTestId('applet-configure-link').first().click();
    await page.waitForURL(/\/applets\/.+/);
    const container = page.locator('.component--applet-image.is-showing-frame');
    await expect(container).toBeVisible();
    await expect(container.locator('.image-frame')).toBeVisible();
    await expect(container.locator('img.applet-image')).toBeVisible();
  });

  test('every image has non-empty alt text', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(5);

    const imgs = page.locator('.component--playlist img.applet-image');
    await expect(imgs).toHaveCount(5);
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      await expect(imgs.nth(i)).toHaveAttribute('alt', /.+/);
    }
  });

  test('zero-byte broken applet uses broken-image src', async ({ page }) => {
    await goToApplets(page);
    const knmiCard = getAppletCard(page, 'knmialert');
    await expect(knmiCard).toBeVisible();
    await expect(knmiCard.locator('img.applet-image')).toHaveAttribute('src', /broken-image\.webp/);
  });
});

test.describe('AppletImage — no horizontal scroll with frame (375 px viewport)', () => {
  test('detail page has no horizontal scroll at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goToApplets(page);
    await page.getByTestId('applet-configure-link').first().click();
    await page.waitForURL(/\/applets\/.+/);

    await expect(page.locator('.component--applet-image.is-showing-frame')).toBeVisible();

    // Compare against innerWidth (not clientWidth, which is reduced by scrollbar width)
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });

  test('library detail page has no horizontal scroll at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/library/applets/clockbyhenry');
    await expect(page.locator('.component--applet-image.is-showing-frame')).toBeVisible();

    // Compare against innerWidth (not clientWidth, which is reduced by scrollbar width)
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('AppletCard', () => {
  test('renders as article with applet name heading in playlist', async ({ page }) => {
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toBeVisible();
    await expect(card.locator('img.applet-image')).toBeVisible();
  });

  test('installed playlist card has Configure CTA link', async ({ page }) => {
    await goToApplets(page);
    const card = page.locator('article.component--applet-card').first();
    await expect(card).toBeVisible();
    await expect(card.getByTestId('applet-configure-link')).toBeVisible();
  });

  test('Configure CTA link navigates to applet detail page', async ({ page }) => {
    await goToApplets(page);
    const configureLink = page.getByTestId('applet-configure-link').first();
    const href = await configureLink.getAttribute('href');
    expect(href).toMatch(/^\/applets\/.+/);
    await configureLink.click();
    await page.waitForURL(/\/applets\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('library card wraps with link to library detail page', async ({ page }) => {
    await page.goto('/library');
    const card = page.locator('article.component--applet-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('a[href*="/library/applets/"]')).toBeVisible();
  });
});

test.describe('AppletItem', () => {
  test('renders one list entry per installed applet', async ({ page }) => {
    await page.goto('/applets');
    const items = page.locator('.component--playlist li');
    await expect(items).toHaveCount(5);
  });

  test('each list entry contains an AppletCard with slot content', async ({ page }) => {
    await page.goto('/applets');
    const items = page.locator('.component--playlist li');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator('article.component--applet-card')).toBeVisible();
    }
  });

  test('passes correct applet data through slot for all installed applets', async ({ page }) => {
    await goToApplets(page);
    const playlist = page.locator('.component--playlist');
    for (const packageName of [
      'clockbyhenry',
      'buienradar',
      'bitcointicker',
      'textbyt',
      'knmialert'
    ]) {
      await expect(
        playlist.locator(`[data-testid="applet-card"][data-applet-package-name="${packageName}"]`)
      ).toBeVisible();
    }
  });
});
