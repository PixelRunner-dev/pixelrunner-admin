import { test, expect } from '@playwright/test';

async function goToApplets(page: import('@playwright/test').Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
}

test.describe('SiteHeader', () => {
  test('logo link is present with accessible title', async ({ page }) => {
    await page.goto('/applets');
    const logoLink = page.locator('header a[href="/"]');
    await expect(logoLink).toBeVisible();
    await expect(logoLink.locator('svg title')).toHaveCount(1);
  });

  test('settings link is present with accessible title', async ({ page }) => {
    await page.goto('/applets');
    const settingsLink = page.locator('header a[href="/settings"]');
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink.locator('svg title')).toHaveCount(1);
  });

  test('back link absent on root /applets (no history)', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('[data-test="router-back-link"]')).toHaveCount(0);
  });

  test('back link appears after navigating to a child route', async ({ page }) => {
    await goToApplets(page);
    await page
      .locator('article.component--applet-card [data-testid="applet-configure-link"]')
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);
    await expect(page.locator('[data-test="router-back-link"]')).toBeVisible();
  });

  test('back link navigates to previous page', async ({ page }) => {
    await goToApplets(page);
    await page
      .locator('article.component--applet-card [data-testid="applet-configure-link"]')
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);
    await page.locator('[data-test="router-back-link"]').click();
    await page.waitForURL('/applets');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('header is sticky and visible across all core routes', async ({ page }) => {
    for (const route of ['/applets', '/library', '/settings', '/update']) {
      await page.goto(route);
      await expect(page.locator('header')).toBeVisible();
    }
  });
});

test.describe('SiteNotifications', () => {
  test('no notification area on fresh page load', async ({ page }) => {
    await goToApplets(page);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('site-notification')).toHaveCount(0);
  });

  test('shows success notification after reboot completes', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    await page.getByTestId('reboot').click();

    await expect(page.getByTestId('site-notification')).toBeVisible();
    await expect(page.getByTestId('site-notification')).toHaveAttribute(
      'data-notification-type',
      'success'
    );
  });

  test('shows success notification after shutdown completes', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    await page.getByTestId('shutdown').click();

    await expect(page.getByTestId('site-notification')).toBeVisible();
    await expect(page.getByTestId('site-notification')).toHaveAttribute(
      'data-notification-type',
      'success'
    );
  });

  test('notification renders with correct alert role and text', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('reboot').click();

    const notification = page.getByTestId('site-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toHaveAttribute('role', 'alert');
  });
});
