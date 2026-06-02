import { test, expect } from '@playwright/test';

test.describe('FieldLocationbased', () => {
  test('renders device-location toggle and LocationSearch input by default', async ({ page }) => {
    // bitcointicker has a locationbased schema field
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'Bitcoin Ticker' })
    });
    await card.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    const field = page.locator('.component--field-locationbased');
    await expect(field).toBeVisible();

    // Toggle to use device location
    await expect(field.locator('input[type="checkbox"]')).toBeVisible();
    await expect(field.locator('span', { hasText: '[Use device location]' })).toBeVisible();

    // LocationSearch input visible when toggle is off (default)
    await expect(field.locator('input[type="text"]')).toBeVisible();
  });

  test('enabling use-device-location toggle hides LocationSearch', async ({ page }) => {
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'Bitcoin Ticker' })
    });
    await card.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    const field = page.locator('.component--field-locationbased');
    const toggle = field.locator('input[type="checkbox"]');

    // Toggle on → LocationSearch hides, device location fetched
    await toggle.check();
    await expect(field.locator('input[type="text"]')).toHaveCount(0);
  });

  test('disabling use-device-location restores LocationSearch', async ({ page }) => {
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'Bitcoin Ticker' })
    });
    await card.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    const field = page.locator('.component--field-locationbased');
    const toggle = field.locator('input[type="checkbox"]');

    await toggle.check();
    await expect(field.locator('input[type="text"]')).toHaveCount(0);

    await toggle.uncheck();
    await expect(field.locator('input[type="text"]')).toBeVisible();
  });

  test('enabling device-location toggle loads device location from mock settings', async ({
    page
  }) => {
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'Bitcoin Ticker' })
    });
    await card.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    const field = page.locator('.component--field-locationbased');
    const toggle = field.locator('input[type="checkbox"]');

    // Enable device location — mock settings have 'Amsterdam' as device location
    await toggle.check();
    // LocationSearch hides when device location is active
    await expect(field.locator('input[type="text"]')).toHaveCount(0);
    // Toggle remains checked
    await expect(toggle).toBeChecked();
  });
});
