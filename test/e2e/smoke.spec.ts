import { test, expect, type Page } from '@playwright/test';

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('App shell smoke', () => {
  test('root / redirects to /applets without errors', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/');
    await page.waitForURL('/applets');

    expect(errors).toHaveLength(0);
  });

  test('/applets renders page heading and document title', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/applets');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle('Applets - Pixelrunner Admin');

    expect(errors).toHaveLength(0);
  });

  test('/library renders page heading and document title', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/library');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle('Library - Pixelrunner Admin');

    expect(errors).toHaveLength(0);
  });

  test('/settings renders page heading and document title', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle('Settings - Pixelrunner Admin');

    expect(errors).toHaveLength(0);
  });

  test('/update renders page heading and document title', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/update');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle('Update - Pixelrunner Admin');

    expect(errors).toHaveLength(0);
  });

  test('site header is present on all core routes', async ({ page }) => {
    const errors = collectPageErrors(page);

    for (const route of ['/applets', '/library', '/settings', '/update']) {
      await page.goto(route);
      await expect(page.locator('header')).toBeVisible();
      await expect(
        page.locator('header svg title').filter({ hasText: 'Go to the settings page' })
      ).toBeAttached();
    }

    expect(errors).toHaveLength(0);
  });

  test('settings gear in header navigates to /settings', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/applets');
    await page.locator('header a[href="/settings"]').click();
    await page.waitForURL('/settings');
    await expect(page.locator('h1')).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
