import { test, expect } from '@playwright/test';

async function goToApplets(page: import('@playwright/test').Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
}

function getAppletCard(page: import('@playwright/test').Page, packageName: string) {
  return page.locator(`[data-testid="applet-card"][data-applet-package-name="${packageName}"]`);
}

test.describe('Playlist management', () => {
  test('shows all installed applets in the playlist', async ({ page }) => {
    await goToApplets(page);
    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(5);
    for (const packageName of [
      'clockbyhenry',
      'buienradar',
      'bitcointicker',
      'textbyt',
      'knmialert'
    ]) {
      await expect(getAppletCard(page, packageName)).toBeVisible();
    }
  });

  test('Go to Library CTA present below playlist', async ({ page }) => {
    await goToApplets(page);
    await expect(page.locator('a.btn-primary[href="/library"]')).toBeVisible();
  });

  test('clicking Configure navigates to applet detail page', async ({ page }) => {
    await goToApplets(page);
    await page
      .locator(
        '.component--playlist article.component--applet-card [data-testid="applet-configure-link"]'
      )
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('applet detail page shows image, title, author, and config form', async ({ page }) => {
    await goToApplets(page);
    await page
      .locator(
        '.component--playlist article.component--applet-card [data-testid="applet-configure-link"]'
      )
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);

    await expect(page.locator('.component--applet-image.is-showing-frame')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.component--applet-details p.text-xs')).toBeVisible();
    await expect(page.locator('.component--applet-config')).toBeVisible();
  });

  test('zero-byte (KNMIalert) applet shows broken-image src in playlist', async ({ page }) => {
    await goToApplets(page);
    const knmiCard = getAppletCard(page, 'knmialert');
    await expect(knmiCard).toBeVisible();
    await expect(knmiCard.locator('img.applet-image')).toHaveAttribute('src', /broken-image\.webp/);
  });

  test('broken image element has CSS fallback background-image', async ({ page }) => {
    await goToApplets(page);
    const img = page.locator('img.applet-image').first();
    await expect(img).toBeVisible();
    const backgroundImage = await img.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(backgroundImage).toContain('broken-image.webp');
  });

  test('navigating to non-existent applet UUID shows not-found state', async ({ page }) => {
    await page.goto('/applets/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/applets\/00000000-0000-0000-0000-000000000000$/);
    await expect(page.getByTestId('site-notification')).toBeVisible();
    await expect(page.getByTestId('site-notification')).toHaveAttribute(
      'data-notification-type',
      'warning'
    );
  });

  test('remove applet via AppletConfig removes it from playlist (SPA)', async ({ page }) => {
    await goToApplets(page);
    const knmiCard = getAppletCard(page, 'knmialert');
    await knmiCard.getByTestId('applet-configure-link').click();
    await page.waitForURL(/\/applets\/.+/);

    await expect(page.getByTestId('applet-remove')).toBeVisible();
    await page.getByTestId('applet-remove').click();

    // After remove — SPA navigation back to /applets
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(/\/applets/);

    await expect(page.locator('.component--playlist li.draggable-applet')).toHaveCount(4);
    await expect(getAppletCard(page, 'knmialert')).toHaveCount(0);
  });
});
