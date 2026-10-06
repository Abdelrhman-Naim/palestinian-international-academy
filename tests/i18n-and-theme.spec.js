import { test, expect } from '@playwright/test';

test.describe('Theme & Language (i18n) Suite', () => {
  test('Toggles Dark and Light mode correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Initial state of dark mode class
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Locate theme toggle button in navbar
    const themeBtn = page.locator('button:has(span.material-symbols-outlined:text("dark_mode")), button:has(span.material-symbols-outlined:text("light_mode"))');
    await expect(themeBtn.first()).toBeVisible();

    // Click to toggle
    await themeBtn.first().click();
    await page.waitForTimeout(400);

    const toggledIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    expect(toggledIsDark).not.toBe(initialIsDark);

    // Click again to revert
    await themeBtn.first().click();
    await page.waitForTimeout(400);

    const revertedIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(revertedIsDark).toBe(initialIsDark);
  });

  test('Toggles Language between Arabic (RTL) and English (LTR)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Initial dir should be rtl or ltr
    const initialDir = await page.evaluate(() => document.documentElement.getAttribute('dir') || 'rtl');

    // Locate language switcher button
    const langBtn = page.locator('button:has(span.material-symbols-outlined:text("language"))');
    await expect(langBtn.first()).toBeVisible();

    await langBtn.first().click();
    await page.waitForTimeout(400);

    const newDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    const expectedDir = initialDir === 'rtl' ? 'ltr' : 'rtl';
    expect(newDir).toBe(expectedDir);

    // Revert back
    await langBtn.first().click();
    await page.waitForTimeout(400);
    const restoredDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    expect(restoredDir).toBe(initialDir);
  });
});
