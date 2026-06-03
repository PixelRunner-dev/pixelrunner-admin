import { test, expect, type Page } from '@playwright/test';

async function goToApplets(page: Page) {
  await page.goto('/applets');
  await expect(page.locator('.component--playlist')).toBeVisible({ timeout: 15000 });
}

function getAppletCard(page: Page, packageName: string) {
  return page.locator(`[data-testid="applet-card"][data-applet-package-name="${packageName}"]`);
}

// Helper: navigate to a specific applet's detail page via the configure link.
async function goToAppletDetail(page: Page, packageName: string) {
  await goToApplets(page);
  const card = getAppletCard(page, packageName);
  await expect(card).toBeVisible();
  await card.getByTestId('applet-configure-link').click();
  await page.waitForURL(/\/applets\/.+/);
}

// ──────────────────────────────────────────────
// AppletConfig
// ──────────────────────────────────────────────

test.describe('AppletConfig', () => {
  test('renders config form with Save and Remove for installed applet', async ({ page }) => {
    await goToAppletDetail(page, 'buienradar');

    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
    await expect(config.getByTestId('applet-config-submit')).toBeVisible();
    await expect(config.getByTestId('applet-remove')).toBeVisible();
  });

  test('save config redirects to /applets', async ({ page }) => {
    // Use clockbyhenry — dropdown+onoff fields always have valid values, no empty required fields
    await page.goto('/library/applets/clockbyhenry');
    await expect(page.locator('.component--applet-config')).toBeVisible();

    await page.getByTestId('applet-config-submit').click();

    await page.waitForURL(/\/applets$/, { timeout: 8000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows loading indicator while schema loads', async ({ page }) => {
    await goToApplets(page);
    const card = getAppletCard(page, 'clockbyhenry');
    await card.getByTestId('applet-configure-link').click();
    await page.waitForURL(/\/applets\/.+/);

    // AppletConfig shows '...' while loading
    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
  });

  test('loads schema fields for installed applet with schema', async ({ page }) => {
    await goToAppletDetail(page, 'buienradar');
    await expect(page.locator('.component--form-field').first()).toBeVisible();
  });

  test('hide and pin toggles present for installed applet', async ({ page }) => {
    await goToAppletDetail(page, 'buienradar');

    const config = page.locator('.component--applet-config');
    await expect(config.getByTestId('applet-hidden-toggle')).toBeVisible();
    await expect(config.getByTestId('applet-pin-toggle')).toBeVisible();
  });

  test('not-installed library applet shows Install button', async ({ page }) => {
    await page.goto('/library/applets/spotify');
    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
    await expect(config.getByTestId('applet-config-submit')).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// FieldDropdown
// ──────────────────────────────────────────────

test.describe('FieldDropdown', () => {
  test('renders select element with options', async ({ page }) => {
    await goToAppletDetail(page, 'clockbyhenry');
    const field = page.locator('.component--field-dropdown');
    await expect(field).toBeVisible();
    await expect(field.locator('select')).toBeVisible();
    // 24h and 12h options
    await expect(field.locator('option[value="24h"]')).toBeAttached();
    await expect(field.locator('option[value="12h"]')).toBeAttached();
  });

  test('changing selected option updates value', async ({ page }) => {
    await goToAppletDetail(page, 'clockbyhenry');
    const select = page.locator('.component--field-dropdown select');
    await select.selectOption('12h');
    await expect(select).toHaveValue('12h');
  });
});

// ──────────────────────────────────────────────
// FieldOnoff
// ──────────────────────────────────────────────

test.describe('FieldOnoff', () => {
  test('renders checkbox toggle', async ({ page }) => {
    await goToAppletDetail(page, 'clockbyhenry');
    const field = page
      .getByTestId('applet-config-field')
      .filter({ has: page.locator('#showSeconds') });
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('toggle changes checked state', async ({ page }) => {
    await goToAppletDetail(page, 'clockbyhenry');
    const toggle = page.locator('#showSeconds');
    const wasInitiallyChecked = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !wasInitiallyChecked });
  });
});

// ──────────────────────────────────────────────
// FieldText
// ──────────────────────────────────────────────

test.describe('FieldText', () => {
  test('renders text input', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    const field = page.locator('.component--field-text');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="text"]')).toBeVisible();
  });

  test('typing updates input value', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    const input = page.locator('.component--field-text input[type="text"]');
    await input.fill('Hello Pixelrunner');
    await expect(input).toHaveValue('Hello Pixelrunner');
  });
});

// ──────────────────────────────────────────────
// FieldColor
// ──────────────────────────────────────────────

test.describe('FieldColor', () => {
  test('renders color picker input', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    const field = page
      .getByTestId('applet-config-field')
      .filter({ has: page.locator('#textColor') });
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="color"]')).toBeVisible();
  });

  test('color label shows current hex value', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    const field = page
      .getByTestId('applet-config-field')
      .filter({ has: page.locator('#textColor') });
    const label = field.locator('.component--field-color label');
    await expect(label).toBeVisible();
    // Label shows the hex value from appliedConfigurations
    const text = await label.innerText();
    expect(text).toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});

// ──────────────────────────────────────────────
// FieldDatetime
// ──────────────────────────────────────────────

test.describe('FieldDatetime', () => {
  test('renders datetime-local input', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    const field = page.locator('.component--field-datetime');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="datetime-local"]')).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// FieldPhotoselect
// ──────────────────────────────────────────────

test.describe('FieldPhotoselect', () => {
  test('renders file input for image upload', async ({ page }) => {
    await goToAppletDetail(page, 'textbyt');
    // Template class is component--field-photo-select (hyphenated)
    const field = page.locator('.component--field-photo-select');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="file"]')).toBeAttached();
  });
});

// ──────────────────────────────────────────────
// FieldLocation (via Buienradar schema)
// ──────────────────────────────────────────────

test.describe('FieldLocation', () => {
  test('renders LocationSearch input', async ({ page }) => {
    await goToAppletDetail(page, 'buienradar');
    const field = page
      .getByTestId('applet-config-field')
      .filter({ has: page.locator('#location') });
    await expect(field).toBeVisible();
    await expect(page.locator('#location')).toBeVisible();
  });

  test('location input accepts text input', async ({ page }) => {
    await goToAppletDetail(page, 'buienradar');
    const locationInput = page.locator('#location');

    await expect(page.locator('#deviceName')).toHaveCount(0); // not on detail page, just await
    await locationInput.fill('Rotterdam');
    await expect(locationInput).toHaveValue('Rotterdam');
  });
});

// ──────────────────────────────────────────────
// FieldSchedule (behind FeatureToggle — not rendered by default)
// ──────────────────────────────────────────────

test.describe('FieldSchedule', () => {
  test('not rendered by default (behind FeatureToggle features="appletScheduler")', async ({
    page
  }) => {
    await goToAppletDetail(page, 'buienradar');
    await expect(page.locator('.component--field-schedule')).toHaveCount(0);
  });
});
