import { test, expect } from '@playwright/test';

test.describe('Mobile Filter Drawer Suite', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test.setTimeout(60000);

  test('Courses filter drawer opens, displays all options, and closes properly', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Locate mobile filter button
    const filterBtn = page.locator('button:has(span:has-text("filter_alt"))');
    await expect(filterBtn).toBeVisible({ timeout: 15000 });
    await filterBtn.click();
    await page.waitForTimeout(500);

    // Drawer aside should now be visible
    const asideDrawer = page.locator('aside');
    await expect(asideDrawer).toBeVisible();

    // Verify reset button and close button in drawer header
    const closeBtn = asideDrawer.locator('button[aria-label="Close filters"]');
    await expect(closeBtn).toBeVisible();

    // Verify sticky footer action button is visible and has correct text
    const applyBtn = asideDrawer.locator('button').filter({ hasText: /عرض النتائج|Show Results/ });
    await expect(applyBtn).toBeVisible();

    // Verify price filter header is present
    const priceFilterHeader = asideDrawer.getByText(/السعر|Price/).first();
    await expect(priceFilterHeader).toBeVisible();

    // Click apply button to close drawer
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Filter drawer should now be hidden or have hidden class
    const isAsideVisible = await asideDrawer.isVisible();
    expect(isAsideVisible).toBeFalsy();
  });

  test('Library filter drawer opens, displays all categories, and closes properly', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Locate mobile filter button
    const filterBtn = page.locator('button:has(span:has-text("filter_alt"))');
    await expect(filterBtn).toBeVisible({ timeout: 15000 });
    await filterBtn.click();
    await page.waitForTimeout(500);

    // Drawer aside should now be visible
    const asideDrawer = page.locator('aside');
    await expect(asideDrawer).toBeVisible();

    // Verify reset button and close button in drawer header
    const closeBtn = asideDrawer.locator('button[aria-label="Close filters"]');
    await expect(closeBtn).toBeVisible();

    // Verify sticky footer action button is visible and has correct text
    const applyBtn = asideDrawer.locator('button').filter({ hasText: /عرض الكتب|Show Books/ });
    await expect(applyBtn).toBeVisible();

    // Click apply button to close drawer
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Filter drawer should now be hidden
    const isAsideVisible = await asideDrawer.isVisible();
    expect(isAsideVisible).toBeFalsy();
  });
});
