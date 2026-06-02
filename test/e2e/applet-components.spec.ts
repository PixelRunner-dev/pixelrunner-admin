import { test, expect } from '@playwright/test';

test.describe('AppletImage', () => {
  test('renders without frame in playlist', async ({ page }) => {
    await page.goto('/applets');
    const container = page.locator('.component--applet-image').first();
    await expect(container).toBeVisible();
    await expect(container).not.toHaveClass(/is-showing-frame/);
    await expect(container.locator('img.applet-image')).toBeVisible();
  });

  test('renders with frame on applet detail page', async ({ page }) => {
    await page.goto('/applets');
    await page.locator('article.component--applet-card a', { hasText: 'Configure' }).first().click();
    await page.waitForURL(/\/applets\/.+/);
    const container = page.locator('.component--applet-image.is-showing-frame');
    await expect(container).toBeVisible();
    await expect(container.locator('.image-frame')).toBeVisible();
    await expect(container.locator('img.applet-image')).toBeVisible();
  });

  test('every image has non-empty alt text', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('img.applet-image').first()).toBeVisible();
    const imgs = page.locator('img.applet-image');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('zero-byte broken applet uses broken-image src', async ({ page }) => {
    await page.goto('/applets');
    const knmiCard = page.locator('article').filter({
      has: page.locator('h2', { hasText: 'KNMIalert' })
    });
    await expect(knmiCard).toBeVisible();
    await expect(knmiCard.locator('img.applet-image')).toHaveAttribute(
      'src',
      /broken-image\.webp/
    );
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
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('a', { hasText: 'Configure' })).toBeVisible();
  });

  test('Configure CTA link navigates to applet detail page', async ({ page }) => {
    await page.goto('/applets');
    const href = await page
      .locator('article.component--applet-card a', { hasText: 'Configure' })
      .first()
      .getAttribute('href');
    expect(href).toMatch(/^\/applets\/.+/);
    await page.locator('article.component--applet-card a', { hasText: 'Configure' }).first().click();
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
    await page.goto('/applets');
    const playlist = page.locator('.component--playlist');
    for (const name of [
      'Clock By Henry',
      'Buienradar',
      'Bitcoin Ticker',
      'Textbyt',
      'KNMIalert'
    ]) {
      await expect(playlist.locator('h2', { hasText: name })).toBeVisible();
    }
  });
});
