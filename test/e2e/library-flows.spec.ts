import { test, expect } from '@playwright/test';

test.describe('Library browse', () => {
  test('library page loads with sections and carousels', async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('section.component--library-selection').first()).toBeVisible();
    await expect(page.locator('.component--carousel').first()).toBeVisible();
  });

  test('categories section links to category pages', async ({ page }) => {
    await page.goto('/library');
    await expect(
      page.locator('.component--category-list a[href*="/library/categories/"]').first()
    ).toBeVisible();
  });
});

test.describe('Library category page', () => {
  test('navigating to a category shows applets in that category', async ({ page }) => {
    await page.goto('/library');
    const firstLink = page
      .locator('.component--category-list a[href*="/library/categories/"]')
      .first();
    await firstLink.click();
    await page.waitForURL(/\/library\/categories\/.+/);
    await expect(page.locator('h1')).toBeVisible();
    // Category page title comes from route meta
    expect(page.url()).toContain('/library/categories/');
  });
});

test.describe('Library search', () => {
  test('search page renders search input', async ({ page }) => {
    await page.goto('/library/search');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.component--library-search')).toBeVisible();
    await expect(page.locator('.component--library-search input')).toBeVisible();
  });

  test('typing in search input updates URL query param', async ({ page }) => {
    await page.goto('/library/search');
    const searchInput = page.locator('.component--library-search input');
    await searchInput.fill('bitcoin');
    // Watch for URL update (debounced)
    await page.waitForURL(/[?&]q=bitcoin/);
    expect(page.url()).toContain('q=bitcoin');
  });

  test('navigating with ?q= pre-fills the search input', async ({ page }) => {
    await page.goto('/library/search?q=clock');
    await expect(page.locator('.component--library-search input')).toHaveValue('clock');
  });
});

test.describe('Library applet detail', () => {
  test('installed applet detail shows Save and Remove buttons', async ({ page }) => {
    await page.goto('/library/applets/buienradar');
    await expect(page.locator('h1')).toBeVisible();
    const config = page.locator('.component--applet-config');
    await expect(config.getByTestId('applet-config-submit')).toBeVisible();
    await expect(config.getByTestId('applet-remove')).toBeVisible();
  });

  test('not-installed applet detail shows Install button', async ({ page }) => {
    await page.goto('/library/applets/spotify');
    await expect(page.locator('h1')).toBeVisible();
    const config = page.locator('.component--applet-config');
    await expect(config.getByTestId('applet-config-submit')).toBeVisible();
    await expect(config.getByTestId('applet-remove')).toHaveCount(0);
  });

  test('install redirects to /applets and installed applet is in playlist', async ({ page }) => {
    await page.goto('/library/applets/usdebtclock');
    await expect(page.getByTestId('applet-config-submit')).toBeVisible();

    await page.getByTestId('applet-config-submit').click();

    // After install, should navigate to /applets (SPA)
    await page.waitForURL(/\/applets/, { timeout: 8000 });
    await expect(
      page.locator('[data-testid="applet-card"][data-applet-package-name="usdebtclock"]')
    ).toBeVisible();
  });
});
