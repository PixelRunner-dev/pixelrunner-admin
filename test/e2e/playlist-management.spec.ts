import { test, expect } from '@playwright/test';

test.describe('Playlist management', () => {
  test('shows all installed applets in the playlist', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(5);
    for (const name of ['Clock By Henry', 'Buienradar', 'Bitcoin Ticker', 'Textbyt', 'KNMIalert']) {
      await expect(page.locator('.component--playlist h2', { hasText: name })).toBeVisible();
    }
  });

  test('Go to Library CTA present below playlist', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('a.btn-primary[href="/library"]')).toBeVisible();
  });

  test('clicking Configure navigates to applet detail page', async ({ page }) => {
    await page.goto('/applets');
    await page
      .locator('.component--playlist article.component--applet-card a', {
        hasText: 'Configure'
      })
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('applet detail page shows image, title, author, and config form', async ({ page }) => {
    await page.goto('/applets');
    await page
      .locator('.component--playlist article.component--applet-card a', {
        hasText: 'Configure'
      })
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);

    await expect(page.locator('.component--applet-image.is-showing-frame')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('p', { hasText: '[By]:' })).toBeVisible();
    await expect(page.locator('.component--applet-config')).toBeVisible();
  });

  test('zero-byte (KNMIalert) applet shows broken-image src in playlist', async ({ page }) => {
    await page.goto('/applets');
    const knmiCard = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'KNMIalert' })
    });
    await expect(knmiCard).toBeVisible();
    await expect(knmiCard.locator('img.applet-image')).toHaveAttribute('src', /broken-image\.webp/);
  });

  test('broken image element has CSS fallback background-image', async ({ page }) => {
    await page.goto('/applets');
    const img = page.locator('img.applet-image').first();
    await expect(img).toBeVisible();
    const backgroundImage = await img.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(backgroundImage).toContain('broken-image.webp');
  });

  test('navigating to non-existent applet UUID shows not-found state', async ({ page }) => {
    await page.goto('/applets/00000000-0000-0000-0000-000000000000');
    await expect(page.locator('h1', { hasText: 'Applet not found' })).toBeVisible();
  });

  test('remove applet via AppletConfig removes it from playlist (SPA)', async ({ page }) => {
    await page.goto('/applets');
    const knmiCard = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'KNMIalert' })
    });
    await knmiCard.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    await expect(
      page.locator('.component--applet-config button', { hasText: 'Remove' })
    ).toBeVisible();
    await page.locator('.component--applet-config button', { hasText: 'Remove' }).click();

    // After remove — SPA navigation back to /applets
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(/\/applets/);

    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(4);
    await expect(page.locator('h2', { hasText: 'KNMIalert' })).toHaveCount(0);
  });
});
