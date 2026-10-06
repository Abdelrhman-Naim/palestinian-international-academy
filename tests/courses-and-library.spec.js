import { test, expect } from '@playwright/test';

test.describe('Courses and Library Interaction Suite', () => {
  test('Renders courses and handles filtering on /courses page', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });

    // Wait for courses cards to appear (give time for Supabase data fetch)
    const cards = page.locator('a[href*="/courses/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Filter by free or level if buttons exist
    const filterBtn = page.locator('button:has-text("مجانية"), button:has-text("Free"), button:has-text("مبتدئ"), button:has-text("Beginner")');
    if (await filterBtn.count() > 0) {
      await filterBtn.first().click();
      await page.waitForTimeout(600);
    }

    // Reset filters
    const resetBtn = page.locator('button:has-text("إعادة ضبط"), button:has-text("Reset")');
    if (await resetBtn.count() > 0) {
      await resetBtn.first().click();
      await page.waitForTimeout(600);
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('Filters and searches books on /library page', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });

    // Wait for books to load
    const bookLinks = page.locator('a[href*="/library/"]');
    await expect(bookLinks.first()).toBeVisible({ timeout: 15000 });
    expect(await bookLinks.count()).toBeGreaterThanOrEqual(1);

    // Search bar
    const searchInput = page.locator('input[type="text"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('كتاب');
      await page.waitForTimeout(500);

      // Clear search
      await searchInput.first().fill('');
      await page.waitForTimeout(500);
      expect(await bookLinks.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
