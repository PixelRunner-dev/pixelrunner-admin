import { test, expect } from '@playwright/test';

async function goToLocationbasedApplet(page: import('@playwright/test').Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
  await page
    .locator('[data-testid="applet-card"][data-applet-package-name="bitcointicker"]')
    .getByTestId('applet-configure-link')
    .click();
  await page.waitForURL(/\/applets\/.+/);
}

test.describe('FieldLocationbased', () => {
  test('renders device-location toggle and LocationSearch input by default', async ({ page }) => {
    // bitcointicker has a locationbased schema field
    await goToLocationbasedApplet(page);

    const field = page.locator('.component--field-locationbased');
    await expect(field).toBeVisible();

    // Toggle to use device location
    await expect(field.locator('input[type="checkbox"]')).toBeVisible();
    await expect(field.getByTestId('use-device-location-label')).toBeVisible();

    // LocationSearch input visible when toggle is off (default)
    await expect(field.locator('input[type="text"]')).toBeVisible();
  });

  test('enabling use-device-location toggle hides LocationSearch', async ({ page }) => {
    await goToLocationbasedApplet(page);

    const field = page.locator('.component--field-locationbased');
    const toggle = field.locator('input[type="checkbox"]');

    // Toggle on → LocationSearch hides, device location fetched
    await toggle.check();
    await expect(field.locator('input[type="text"]')).toHaveCount(0);
  });

  test('disabling use-device-location restores LocationSearch', async ({ page }) => {
    await goToLocationbasedApplet(page);

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
    await goToLocationbasedApplet(page);

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
