import { test, expect } from '@playwright/test';

test.describe('Luxury Responsive Footer Suite', () => {
  test.setTimeout(60000);

  test('Mobile viewport (375x667): Footer renders luxury elements and no elements hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/about', { waitUntil: 'commit', timeout: 45000 });
    await page.locator('footer').waitFor({ state: 'visible', timeout: 20000 });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // 1. Digital Certificate Verification Banner
    const certBanner = footer.getByText(/منظومة التحقق من الشهادات الرقمية|Digital Certificate Verification/);
    await expect(certBanner).toBeVisible();

    // 2. Official Accreditation Badge
    const accredBadge = footer.getByText(/أكاديمية معتمدة دولياً|Accredited Academy/);
    await expect(accredBadge).toBeVisible();

    // 3. Official Social Channels
    const socialLinks = footer.locator('a[aria-label="WhatsApp"], a[aria-label="Telegram"], a[aria-label="LinkedIn"]');
    expect(await socialLinks.count()).toBeGreaterThanOrEqual(3);

    // 4. Mobile Section Cards & Links
    const coursesTitle = footer.getByText(/المسارات والدورات|Courses & Tracks/).first();
    await expect(coursesTitle).toBeVisible();

    const servicesTitle = footer.getByText(/الخدمات والتحقق|Services & Verification/).first();
    await expect(servicesTitle).toBeVisible();

    // Verify verification link is visible inside services
    const verifyLink = footer.locator('a').filter({ hasText: /التحقق من الشهادة الرقمية|Certificate Verification/ }).first();
    await expect(verifyLink).toBeVisible();

    // 5. Direct Advisory / WhatsApp Row
    const whatsappBtn = footer.locator('a').filter({ hasText: /واتساب مباشر|Live WhatsApp/ });
    await expect(whatsappBtn).toBeVisible();

    // 6. Copyright Notice and Back to Top
    const copyright = footer.getByText(/PALESTINIAN INTERNATIONAL ACADEMY/);
    await expect(copyright).toBeVisible();

    const backToTopBtn = footer.locator('button[title*="العودة للأعلى"], button[title*="Back to top"], button[aria-label*="العودة للأعلى"]');
    await expect(backToTopBtn).toBeVisible();
  });

  test('Desktop viewport (1280x800): Footer renders in 4-column luxury layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/about', { waitUntil: 'commit', timeout: 45000 });
    await page.locator('footer').waitFor({ state: 'visible', timeout: 20000 });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // On desktop, the columns should be visible simultaneously
    const coursesLink = footer.locator('a[href="/courses"]').first();
    await expect(coursesLink).toBeVisible();

    const libraryLink = footer.locator('a[href="/library"]').first();
    await expect(libraryLink).toBeVisible();

    const privacyLink = footer.locator('a[href="/privacy"]').first();
    await expect(privacyLink).toBeVisible();
  });
});
