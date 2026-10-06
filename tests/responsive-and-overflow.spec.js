import { test, expect } from '@playwright/test';

test.describe('Responsive & Horizontal Overflow Suite', () => {
  const viewports = [
    { width: 320, height: 600, label: 'Small Mobile (320px)' },
    { width: 375, height: 667, label: 'Standard Mobile (375px)' },
    { width: 414, height: 896, label: 'Large Mobile (414px)' },
    { width: 768, height: 1024, label: 'Tablet (768px)' },
    { width: 1280, height: 800, label: 'Desktop (1280px)' },
  ];

  const testPages = ['/', '/about', '/courses', '/library', '/login', '/register'];

  for (const vp of viewports) {
    for (const pagePath of testPages) {
      test(`Zero horizontal overflow on ${vp.label} for ${pagePath}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Evaluate scrollWidth vs clientWidth
        const overflowCheck = await page.evaluate(() => {
          const docEl = document.documentElement;
          const bodyEl = document.body;
          const maxWidth = Math.max(docEl.scrollWidth, bodyEl.scrollWidth);
          const winWidth = window.innerWidth;
          // allow 1px tolerance for fractional subpixel rendering
          return {
            overflow: maxWidth > winWidth + 1,
            maxWidth,
            winWidth,
          };
        });

        expect(
          overflowCheck.overflow,
          `Horizontal overflow detected on ${pagePath} at width ${vp.width}px! scrollWidth=${overflowCheck.maxWidth}, innerWidth=${overflowCheck.winWidth}`
        ).toBe(false);
      });
    }
  }

  test('Mobile Bottom Navigation is visible on small screen and hidden on desktop', async ({ page }) => {
    // 1. Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const mobileNav = page.locator('nav[aria-label="التنقل السفلي"], nav[aria-label="Mobile Navigation"], nav[aria-label*="التنقل"], nav[aria-label*="Navigation"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }

    // 2. Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeHidden();
    }
  });

  test('Mobile menu in Navbar can open and close smoothly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Find hamburger button
    const menuBtn = page.locator('button[aria-label="فتح القائمة الرئيسية"], button[aria-label="إغلاق القائمة"], button:has-text("menu")');
    if (await menuBtn.count() > 0) {
      await menuBtn.first().click();
      await page.waitForTimeout(300);

      // Verify close button or opened menu container appears
      const closeBtn = page.locator('button[aria-label="إغلاق القائمة"], button:has-text("close")');
      await expect(closeBtn.first()).toBeVisible();

      // Click to close
      await closeBtn.first().click();
      await page.waitForTimeout(300);
    }
  });
});
