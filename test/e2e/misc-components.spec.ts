import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────
// AccessWarning
// ──────────────────────────────────────────────

test.describe('AccessWarning', () => {
  test('not shown on localhost (local access mode)', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.component--access-warning')).toHaveCount(0);
  });

  test('shown when accessMode=direct cookie is set', async ({ context }) => {
    await context.addCookies([
      { name: 'accessMode', value: 'direct', domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await page.goto('/applets');

    const warning = page.locator('.component--access-warning');
    await expect(warning).toBeVisible();
    await expect(warning.locator('.access-warning__title')).toBeVisible();
    await expect(warning.locator('.access-warning__message')).toBeVisible();
    await expect(warning.locator('.access-warning__instruction')).toBeVisible();
    await page.close();
  });

  test('access warning is teleported to body (not inside header/main)', async ({ context }) => {
    await context.addCookies([
      { name: 'accessMode', value: 'direct', domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await page.goto('/applets');

    // Teleport puts it directly under body, not nested in app wrappers
    const warningInBody = page.locator('body > .component--access-warning');
    await expect(warningInBody).toBeVisible();
    await page.close();
  });

  test('access warning title is rendered', async ({ context }) => {
    await context.addCookies([
      { name: 'accessMode', value: 'direct', domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await page.goto('/applets');
    await expect(page.locator('.access-warning__title')).toBeVisible();
    await page.close();
  });
});

// ──────────────────────────────────────────────
// FeatureToggle
// ──────────────────────────────────────────────

test.describe('FeatureToggle', () => {
  test('hides slot content when experimental features are disabled (default)', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();
    // Update Device button is behind FeatureToggle features="updateDevice"
    await expect(page.getByTestId('firmware-update')).toHaveCount(0);
  });

  test('shows slot content after enabling experimentalFeatures + feature toggle via UI', async ({
    page
  }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // Enable experimental features checkbox
    const experimentalCheckbox = page.locator('#experimentalFeatures');
    await expect(experimentalCheckbox).toBeVisible();
    await experimentalCheckbox.check();

    // Wait for feature list to appear
    await expect(
      page.locator('[data-testid="feature-toggle-row"][data-feature-key="debug"]')
    ).toBeVisible();

    // Enable the debug feature toggle
    const debugToggle = page.locator(
      '[data-testid="feature-toggle-control"][data-feature-key="debug"] input[type="checkbox"]'
    );
    await debugToggle.check();

    // Navigate via SPA link (not page.goto) to preserve in-memory mock state
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(/\/applets/);

    // DebugSection is behind FeatureToggle features="debug" and should now be visible
    await expect(page.locator('.debug-panel').first()).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// DebugSection
// ──────────────────────────────────────────────

test.describe('DebugSection', () => {
  test('not rendered by default (hidden behind FeatureToggle)', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('.debug-panel')).toHaveCount(0);
  });

  test('renders with expected structure when debug feature is enabled', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // Enable experimental features
    const experimentalCheckbox = page.locator('#experimentalFeatures');
    await experimentalCheckbox.check();
    await expect(
      page.locator('[data-testid="feature-toggle-row"][data-feature-key="debug"]')
    ).toBeVisible();

    // Enable debug toggle
    const debugToggle = page.locator(
      '[data-testid="feature-toggle-control"][data-feature-key="debug"] input[type="checkbox"]'
    );
    await debugToggle.check();

    // Navigate via SPA link to preserve in-memory mock state
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(/\/applets/);

    await expect(page.locator('.debug-panel').first()).toBeVisible();

    const panel = page.locator('.debug-panel').first();
    await expect(panel.getByTestId('debug-title')).toBeVisible();
    await expect(panel.getByTestId('debug-raw-toggle')).toBeVisible();
  });
});
