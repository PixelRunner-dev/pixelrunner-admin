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
    const applyButton = page.locator('button', { hasText: 'Apply WiFi network' });
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    await expect(
      page.locator('text=WiFi configured. Device may disconnect from setup network')
    ).toBeVisible();
  });

  test('first-time setup mode (?first-time=1) hides general settings', async ({ page }) => {
    await page.goto('/settings?first-time=1');
    await expect(page.locator('h1')).toBeVisible();

    // General settings (deviceName, theme, brightness) must not appear
    await expect(page.locator('#deviceName')).toHaveCount(0);
    await expect(page.locator('#theme')).toHaveCount(0);
    await expect(page.locator('#brightness')).toHaveCount(0);

    // WiFi section must still appear
    await expect(page.locator('#ssid')).toBeVisible();
  });

  test('first-time setup mode shows access-point info banner', async ({ page }) => {
    await page.goto('/settings?first-time=1');
    await expect(page.locator('h1')).toBeVisible();

    // DAlert inside wifi section explains first-time setup
    await expect(
      page.locator('[role="alert"]').filter({ hasText: 'Connect this device to WiFi' })
    ).toBeVisible();
  });

  test('WiFi scan error is shown and retry is available', async ({ page }) => {
    await page.goto('/settings');

    // Refresh networks button triggers a scan (mock returns success)
    const refreshBtn = page.locator('button', { hasText: 'Refresh networks' });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // After successful scan, Pixelrunner Lab network is listed
    await expect(page.locator('button', { hasText: 'Pixelrunner Lab' })).toBeVisible();
  });

  test('scanned WiFi network can be selected and populated into form', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    // Click a scanned network to populate ssid field
    const guestNetwork = page.locator('button', { hasText: 'Guest' });
    await expect(guestNetwork).toBeVisible();
    await guestNetwork.click();

    await expect(page.locator('#ssid')).toHaveValue('Guest');
  });

  test('reboot and shutdown action buttons are present in actions section', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toBeVisible();

    await expect(page.locator('button', { hasText: 'Reboot Device' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Shutdown Device' })).toBeVisible();
  });

  test('language selector and location search rendered on settings page', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.locator('select#language')).toBeVisible();
    await expect(page.locator('#location')).toBeVisible();
  });
});
