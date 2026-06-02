import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────
// LibrarySection
// ──────────────────────────────────────────────

test.describe('LibrarySection', () => {
  test('renders section with h2 title', async ({ page }) => {
    await page.goto('/library');
    const section = page.locator('section.component--library-selection').first();
    await expect(section).toBeVisible();
    // Use text-3xl h2 — this is the LibrarySection title; applet h2s use text-lg
    await expect(section.locator('h2.text-3xl')).toBeVisible();
  });

  test('shows optional payoff paragraph when provided', async ({ page }) => {
    await page.goto('/library');
    const sectionWithPayoff = page
      .locator('section.component--library-selection')
      .filter({ has: page.locator('hgroup p.text-lg') });
    await expect(sectionWithPayoff.first()).toBeVisible();
    await expect(sectionWithPayoff.first().locator('hgroup p.text-lg')).toBeVisible();
  });

  test('slot content renders inside section', async ({ page }) => {
    await page.goto('/library');
    const section = page.locator('section.component--library-selection').first();
    await expect(section.locator('.component--carousel')).toBeVisible();
  });

  test('multiple library sections present on library page', async ({ page }) => {
    await page.goto('/library');
    // Wait for at least one section to be visible before counting
    await expect(page.locator('section.component--library-selection').first()).toBeVisible();
    const count = await page.locator('section.component--library-selection').count();
    expect(count).toBeGreaterThan(1);
  });
});

// ──────────────────────────────────────────────
// CategoryList
// ──────────────────────────────────────────────

test.describe('CategoryList', () => {
  test('renders category list on library page (non-interactive)', async ({ page }) => {
    await page.goto('/library');
    const list = page.locator('.component--category-list').first();
    await expect(list).toBeVisible();
    await expect(list.locator('li').first()).toBeVisible();
  });

  test('categories show translated labels', async ({ page }) => {
    await page.goto('/library');
    const list = page.locator('.component--category-list').first();
    // Each category li should have text (translated label)
    const firstItem = list.locator('li').first();
    await expect(firstItem).toBeVisible();
    const text = await firstItem.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('interactive mode renders router-links to category pages', async ({ page }) => {
    await page.goto('/library');
    // Library categories section uses isInteractive — items link to /library/categories/:key
    const categoryLinks = page.locator('.component--category-list a[href*="/library/categories/"]');
    await expect(categoryLinks.first()).toBeVisible();
  });

  test('clicking category link navigates to category page', async ({ page }) => {
    await page.goto('/library');
    const firstCategoryLink = page
      .locator('.component--category-list a[href*="/library/categories/"]')
      .first();
    await firstCategoryLink.click();
    await page.waitForURL(/\/library\/categories\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('renders inline with hasItemsInline on applet detail page', async ({ page }) => {
    await page.goto('/applets');
    await page
      .locator('article.component--applet-card a', { hasText: 'Configure' })
      .first()
      .click();
    await page.waitForURL(/\/applets\/.+/);
    // Detail page renders CategoryList with hasItemsInline — uses menu-horizontal class
    const inlineList = page.locator('.component--category-list.menu-horizontal');
    await expect(inlineList).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// CallToAction
// ──────────────────────────────────────────────

test.describe('CallToAction', () => {
  // CallToAction.vue is a standalone button component not currently integrated
  // into any app route. Its design surface (component--call-to-action CSS class)
  // has no live route to test against. The nearest equivalent in the app is the
  // "Go to Library" primary CTA button on the /applets page.

  test('"Go to library" CTA button present and navigates to library', async ({ page }) => {
    await page.goto('/applets');
    const ctaLink = page.locator('a.btn-primary[href="/library"]');
    await expect(ctaLink).toBeVisible();
    await ctaLink.click();
    await page.waitForURL('/library');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('AppletCard Configure CTA link present for each installed applet', async ({ page }) => {
    await page.goto('/applets');
    const configureLinks = page.locator('article.component--applet-card a', {
      hasText: 'Configure'
    });
    await expect(configureLinks.first()).toBeVisible();
    expect(await configureLinks.count()).toBe(5);
  });
});
