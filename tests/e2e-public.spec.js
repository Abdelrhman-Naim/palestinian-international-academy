import { test, expect } from '@playwright/test';
import { setupPageLogger, saveAuditReport } from './utils/auditLogger.js';

test.describe('Public Pages Full E2E & Debug Audit', () => {
  test.setTimeout(180000);
  const REPORT_PATH = 'test-results/audit-report.json';

  test('Public Pages & Details Pages Audit', async ({ page }) => {
    const issues = setupPageLogger(page, 'Public Pages Audit');

    const publicPages = [
      { name: 'Home', path: '/' },
      { name: 'Courses', path: '/courses' },
      { name: 'Library', path: '/library' },
      { name: 'About', path: '/about' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Verify Certificate', path: '/verify-certificate' },
      { name: 'Virtual Lab', path: '/virtual-lab' },
      { name: 'Partnerships', path: '/partnerships' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ];

    for (const p of publicPages) {
      console.log(`Auditing ${p.name} (${p.path})...`);
      await page.goto(p.path, { waitUntil: 'commit', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Verify page element loads
      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    }

    // Specific audit on Courses Page:
    await page.goto('/courses', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Check paid course price display (must have $ sign)
    const paidBadges = page.locator('span:has-text("$")');
    const countWithDollar = await paidBadges.count();
    console.log(`Paid courses with $ sign found: ${countWithDollar}`);

    // Check if Course Detail opens
    const courseCard = page.locator('a[href*="/courses/"]').first();
    if (await courseCard.count() > 0) {
      const courseHref = await courseCard.getAttribute('href');
      if (courseHref) {
        console.log(`Auditing Course Detail: ${courseHref}`);
        await page.goto(courseHref, { waitUntil: 'commit', timeout: 30000 });
        await page.waitForTimeout(1500);
      }
    }

    // Check if Book Detail opens
    await page.goto('/library', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    const bookCard = page.locator('a[href*="/library/"]').first();
    if (await bookCard.count() > 0) {
      const bookHref = await bookCard.getAttribute('href');
      if (bookHref) {
        console.log(`Auditing Book Detail: ${bookHref}`);
        await page.goto(bookHref, { waitUntil: 'commit', timeout: 30000 });
        await page.waitForTimeout(1500);
      }
    }

    // Save all recorded issues
    saveAuditReport(REPORT_PATH, issues);
  });
});
