import { test, expect } from '@playwright/test';

test.describe('Connection states', () => {
  test('app renders normally in mock mode (connected state, no error UI)', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('h1')).toBeVisible();
    // No connection-error banners or retry buttons in the connected state
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });

  test('?via=proxy param does not cause errors and keeps app in local mode', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/?via=proxy');
    // Router preserves query params on redirect → /applets?via=proxy
    await page.waitForURL(/\/applets/);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.component--access-warning')).toHaveCount(0);
    expect(errors).toHaveLength(0);
  });

  test('no sensitive credential patterns visible in page DOM text', async ({ page }) => {
    await page.goto('/applets');
    await expect(page.locator('h1')).toBeVisible();

    const bodyText = await page.locator('body').innerText();

    // None of these patterns should appear as visible text
    const sensitivePatterns = [/roomPassword/i, /pairingToken/i, /pairing.*secret/i];
    for (const pattern of sensitivePatterns) {
      expect(bodyText).not.toMatch(pattern);
    }
  });

  test('no sensitive credential patterns in console output', async ({ page }) => {
    const consoleMsgs: string[] = [];
    page.on('console', (msg) => consoleMsgs.push(msg.text()));

    await page.goto('/applets');
    await expect(page.locator('h1')).toBeVisible();

    const sensitivePatterns = [/roomPassword\s*[:=]\s*\S+/, /pairingToken\s*[:=]\s*\S+/];
    for (const msg of consoleMsgs) {
      for (const pattern of sensitivePatterns) {
        expect(msg).not.toMatch(pattern);
      }
    }
  });

  test('local proxy mode: app accessible via ?via=proxy without AccessWarning', async ({
    page
  }) => {
    await page.goto('/settings?via=proxy');
    await page.waitForURL(/\/settings/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.component--access-warning')).toHaveCount(0);
  });

  test('direct-cloud mode shows AccessWarning, not regular app UI', async ({ context }) => {
    await context.addCookies([
      { name: 'accessMode', value: 'direct', domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await page.goto('/applets');

    await expect(page.locator('.component--access-warning')).toBeVisible();
    // Regular app navigation is hidden behind the warning
    await expect(page.locator('header')).toHaveCount(0);
    await page.close();
  });
});
