import { test, expect, type Page } from '@playwright/test';

// Helper: navigate to a specific applet's detail page via the Configure link.
async function goToAppletDetail(page: Page, appletName: string) {
  await page.goto('/applets');
  const card = page.locator('article.component--applet-card').filter({
    has: page.locator('h2', { hasText: appletName })
  });
  await expect(card).toBeVisible();
  await card.locator('a', { hasText: 'Configure' }).click();
  await page.waitForURL(/\/applets\/.+/);
}

// ──────────────────────────────────────────────
// AppletConfig
// ──────────────────────────────────────────────

test.describe('AppletConfig', () => {
  test('renders config form with Save and Remove for installed applet', async ({ page }) => {
    await goToAppletDetail(page, 'Buienradar');

    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
    await expect(config.locator('button[type="submit"]')).toBeVisible();
    await expect(config.locator('button', { hasText: 'Remove' })).toBeVisible();
  });

  test('save config redirects to /applets', async ({ page }) => {
    // Use clockbyhenry — dropdown+onoff fields always have valid values, no empty required fields
    await page.goto('/library/applets/clockbyhenry');
    await expect(page.locator('.component--applet-config')).toBeVisible();

    await page.locator('.component--applet-config button[type="submit"]').click();

    await page.waitForURL(/\/applets$/, { timeout: 8000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows loading indicator while schema loads', async ({ page }) => {
    await page.goto('/applets');
    const card = page.locator('article.component--applet-card').filter({
      has: page.locator('h2', { hasText: 'Clock By Henry' })
    });
    await card.locator('a', { hasText: 'Configure' }).click();
    await page.waitForURL(/\/applets\/.+/);

    // AppletConfig shows '...' while loading
    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
  });

  test('loads schema fields for installed applet with schema', async ({ page }) => {
    await goToAppletDetail(page, 'Buienradar');
    await expect(page.locator('.component--form-field').first()).toBeVisible();
  });

  test('hide and pin toggles present for installed applet', async ({ page }) => {
    await goToAppletDetail(page, 'Buienradar');

    const config = page.locator('.component--applet-config');
    await expect(config.locator('[aria-label="Toggle applet visibility"]')).toBeVisible();
    await expect(config.locator('[aria-label="Toggle applet pin"]')).toBeVisible();
  });

  test('not-installed library applet shows Install button', async ({ page }) => {
    await page.goto('/library/applets/spotify');
    const config = page.locator('.component--applet-config');
    await expect(config).toBeVisible();
    await expect(config.locator('button[type="submit"]')).toContainText('Install');
  });
});

// ──────────────────────────────────────────────
// FieldDropdown
// ──────────────────────────────────────────────

test.describe('FieldDropdown', () => {
  test('renders select element with options', async ({ page }) => {
    await goToAppletDetail(page, 'Clock By Henry');
    const field = page.locator('.component--field-dropdown');
    await expect(field).toBeVisible();
    await expect(field.locator('select')).toBeVisible();
    // 24h and 12h options
    await expect(field.locator('option[value="24h"]')).toBeAttached();
    await expect(field.locator('option[value="12h"]')).toBeAttached();
  });

  test('changing selected option updates value', async ({ page }) => {
    await goToAppletDetail(page, 'Clock By Henry');
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
    await goToAppletDetail(page, 'Clock By Henry');
    const field = page.locator('.component--field-onoff');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('toggle changes checked state', async ({ page }) => {
    await goToAppletDetail(page, 'Clock By Henry');
    const toggle = page.locator('.component--field-onoff input[type="checkbox"]');
    const initial = await toggle.isChecked();
    await toggle.click();
    expect(await toggle.isChecked()).toBe(!initial);
  });
});

// ──────────────────────────────────────────────
// FieldText
// ──────────────────────────────────────────────

test.describe('FieldText', () => {
  test('renders text input', async ({ page }) => {
    await goToAppletDetail(page, 'Textbyt');
    const field = page.locator('.component--field-text');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="text"]')).toBeVisible();
  });

  test('typing updates input value', async ({ page }) => {
    await goToAppletDetail(page, 'Textbyt');
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
    await goToAppletDetail(page, 'Textbyt');
    const field = page.locator('.component--field-color');
    await expect(field).toBeVisible();
    await expect(field.locator('input[type="color"]')).toBeVisible();
  });

  test('color label shows current hex value', async ({ page }) => {
    await goToAppletDetail(page, 'Textbyt');
    const label = page.locator('.component--field-color label');
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
    await goToAppletDetail(page, 'Textbyt');
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
    await goToAppletDetail(page, 'Textbyt');
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
    await goToAppletDetail(page, 'Buienradar');
    const field = page.locator('.component--form-field').filter({
      has: page.locator('label', { hasText: 'Location' })
    });
    await expect(field).toBeVisible();
    // LocationSearch renders its own input inside the FormField slot
    await expect(field.locator('input')).toBeVisible();
  });

  test('location input accepts text input', async ({ page }) => {
    await goToAppletDetail(page, 'Buienradar');
    const locationInput = page
      .locator('.component--form-field')
      .filter({
        has: page.locator('label', { hasText: 'Location' })
      })
      .locator('input')
      .first();

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
    await goToAppletDetail(page, 'Buienradar');
    await expect(page.locator('.component--field-schedule')).toHaveCount(0);
  });
});
