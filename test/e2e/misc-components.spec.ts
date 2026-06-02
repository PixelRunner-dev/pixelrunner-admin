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

  test('access warning title contains expected text', async ({ context }) => {
    await context.addCookies([
      { name: 'accessMode', value: 'direct', domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await page.goto('/applets');
    await expect(page.locator('.access-warning__title')).toHaveText(/Access Via Device IP/i);
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
    await expect(page.locator('button', { hasText: 'Update Device' })).toHaveCount(0);
  });

  test('shows slot content after enabling experimentalFeatures + feature toggle via UI', async ({
    page
  }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // Enable experimental features checkbox — set up console listener first
    const experimentalSaved = page.waitForEvent('console', (msg) =>
      msg.text().includes('Saved device setting: experimentalFeatures')
    );
    const experimentalCheckbox = page.locator('#experimentalFeatures');
    await expect(experimentalCheckbox).toBeVisible();
    await experimentalCheckbox.check();

    // Wait for feature list to appear and the debounced save to complete
    await expect(page.locator('text=Enable debug tool')).toBeVisible();
    await experimentalSaved;

    // Enable the debug feature toggle — set up console listener first
    const debugToggle = page
      .locator('dl div')
      .filter({ hasText: 'Enable debug tool' })
      .locator('input[type="checkbox"]');
    const debugSaved = page.waitForEvent('console', (msg) =>
      msg.text().includes('Saved feature toggle setting: debug')
    );
    await debugToggle.check();
    await debugSaved;

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

    // Enable experimental features — set up console listener first
    const experimentalSaved = page.waitForEvent('console', (msg) =>
      msg.text().includes('Saved device setting: experimentalFeatures')
    );
    const experimentalCheckbox = page.locator('#experimentalFeatures');
    await experimentalCheckbox.check();
    await expect(page.locator('text=Enable debug tool')).toBeVisible();
    await experimentalSaved;

    // Enable debug toggle — set up console listener first
    const debugToggle = page
      .locator('dl div')
      .filter({ hasText: 'Enable debug tool' })
      .locator('input[type="checkbox"]');
    const debugSaved = page.waitForEvent('console', (msg) =>
      msg.text().includes('Saved feature toggle setting: debug')
    );
    await debugToggle.check();
    await debugSaved;

    // Navigate via SPA link to preserve in-memory mock state
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(/\/applets/);

    await expect(page.locator('.debug-panel').first()).toBeVisible();

    const panel = page.locator('.debug-panel').first();
    await expect(panel.locator('h2', { hasText: 'Debug' })).toBeVisible();
    await expect(panel.locator('details summary', { hasText: 'Toggle raw data' })).toBeVisible();
  });
});
