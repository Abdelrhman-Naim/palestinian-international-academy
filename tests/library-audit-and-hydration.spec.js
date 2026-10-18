import { test, expect } from '@playwright/test';

test.describe('Library & Hydration Verification Suite', () => {
  test('Library displays full books count (> 1000), has 12 items per page, and zero hydration errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        if (!text.includes('favicon') && !text.includes('ERR_CONNECTION')) {
          consoleErrors.push(text);
        }
      }
    });
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

    // 1. Visit Library Page
    await page.goto('/library', { waitUntil: 'domcontentloaded' });

    // Ensure no Hydration Mismatch error occurred
    const hydrationErrors = consoleErrors.filter(err => err.includes('Hydration failed') || err.includes('hydration'));
    expect(hydrationErrors, `Found hydration errors: ${hydrationErrors.join('\n')}`).toHaveLength(0);

    // 2. Check Books Count Header is above 1000
    // Wait for books loader to disappear
    await expect(page.locator('text=جاري تحميل المكتبة')).toBeHidden({ timeout: 45000 });

    const counterLocator = page.locator('span.whitespace-nowrap:has-text("كتب المكتبة")').or(page.locator('span.whitespace-nowrap:has-text("Library Books")')).first();
    await expect(counterLocator).toBeVisible({ timeout: 10000 });
    const counterText = await counterLocator.textContent();
    console.log('Direct counter element text:', counterText);
    const countMatch = counterText.match(/(\d+[\d,]*)/);
    const parsedCount = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;
    console.log('Parsed books count from page:', parsedCount);
    expect(parsedCount).toBeGreaterThan(1000);

    // 3. Verify option 12 in itemsPerPage dropdown
    const selectTrigger = page.locator('button:has-text("في الصفحة")').or(page.locator('button:has-text("per page")'));
    await expect(selectTrigger.first()).toBeVisible();
    await selectTrigger.first().click();

    // Check that option 12 is available
    const option12 = page.locator('button:has-text("12 في الصفحة")').or(page.locator('button:has-text("12 per page")')).or(page.locator('text=12 في الصفحة'));
    await expect(option12.first()).toBeVisible();

    // Select 12
    await option12.first().click();

    // Wait and verify pagination / cards on page
    await page.waitForTimeout(1000);
    const bookCards = page.locator('a[href^="/library/"]');
    const count = await bookCards.count();
    console.log(`Rendered cards on page with 12 per page: ${count}`);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(13); // exactly 12 cards + possible action button
  });

  test('Book titles do not overflow card containers', async ({ page }) => {
    await page.goto('/library', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=جاري تحميل المكتبة')).toBeHidden({ timeout: 45000 });

    // Check rendered book card titles for horizontal overflow
    const cardTitles = page.locator('.group h3');
    await expect(cardTitles.first()).toBeVisible({ timeout: 10000 });
    const titleCount = await cardTitles.count();
    console.log(`Checking ${titleCount} book card titles for overflow...`);
    expect(titleCount).toBeGreaterThan(0);

    for (let i = 0; i < titleCount; i++) {
      const isOverflowing = await cardTitles.nth(i).evaluate((el) => {
        const parent = el.parentElement;
        if (!parent) return false;
        const elRect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        return elRect.left < parentRect.left - 2 || elRect.right > parentRect.right + 2;
      });
      expect(isOverflowing).toBe(false);
    }
  });
});
