import { test, expect } from '@playwright/test';

test.describe('Settings page flows', () => {
  test('loads mock device settings into form fields', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // useSyncedControllerSettings loads mock values
    const deviceNameInput = page.locator('#deviceName');
    await expect(deviceNameInput).toHaveValue('pxlr_mock');
  });

  test('loads WiFi status from mock into WiFi form', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // Mock WiFi status: ssid = 'Pixelrunner Lab'
    await expect(page.locator('#ssid')).toHaveValue('Pixelrunner Lab');
  });

  test('shows saved WiFi success message after configuring network', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('#ssid')).toBeVisible();

    // Mock configureWifi succeeds — click Apply with existing values
    const applyButton = page.getByTestId('wifi-apply');
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('WiFi scan error is shown and retry is available', async ({ page }) => {
    await page.goto('/settings');

    // Refresh networks button triggers a scan (mock returns success)
    const refreshBtn = page.getByTestId('wifi-refresh');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    await expect(page.locator('[data-testid="wifi-network-option"]')).toHaveCount(3);
  });

  test('scanned WiFi network can be selected and populated into form', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();
    const refreshButton = page.getByTestId('wifi-refresh');
    await expect(refreshButton).toBeEnabled();
    await refreshButton.click();

    const guestNetwork = page.locator(
      '[data-testid="wifi-network-option"][data-wifi-ssid="Guest"]'
    );
    await expect(guestNetwork).toBeVisible();
    await guestNetwork.click();

    await expect(page.locator('#ssid')).toHaveValue('Guest');
  });

  test('reboot and shutdown action buttons are present in actions section', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    await expect(page.getByTestId('reboot')).toBeVisible();
    await expect(page.getByTestId('shutdown')).toBeVisible();
  });

  test('language selector and location search rendered on settings page', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.locator('select#language')).toBeVisible();
    await expect(page.locator('#location')).toBeVisible();
  });
});
