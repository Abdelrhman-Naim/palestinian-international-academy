import { test, expect } from '@playwright/test';
import { setupPageLogger, saveAuditReport } from './utils/auditLogger.js';

test.describe('Student Full E2E & Debug Audit', () => {
  test.setTimeout(90000);
  const REPORT_PATH = 'test-results/audit-report.json';
  let issues = [];

  test.afterEach(() => {
    saveAuditReport(REPORT_PATH, issues);
  });

  test('Student Authentication & Dashboard Navigation', async ({ page }) => {
    issues = setupPageLogger(page, 'Student Dashboard Audit');

    // 1. Go to Login page
    await page.goto('/login', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');

    // 2. Fill student credentials
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('abood12.e.m@gmail.com');
    await passwordInput.fill('123123');
    await submitBtn.click();

    // 3. Verify successful redirection to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 35000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/dashboard');

    // 4. Test Student Overview Page
    const overviewHeading = page.locator('h1, h2, h3').first();
    await expect(overviewHeading).toBeVisible();

    // 5. Navigate to /dashboard/courses (My Courses)
    await page.goto('/dashboard/courses', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard/courses');

    // 6. Navigate to /dashboard/assignments
    await page.goto('/dashboard/assignments', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard/assignments');

    // 7. Navigate to /dashboard/certificates
    await page.goto('/dashboard/certificates', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard/certificates');

    // 8. Navigate to /dashboard/saved-books
    await page.goto('/dashboard/saved-books', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard/saved-books');

    // 9. Navigate to /dashboard/profile
    await page.goto('/dashboard/profile', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard/profile');

    // 10. Navigate to /dashboard/messages
    await page.goto('/dashboard/messages', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/dashboard/messages');

    // Save any issues detected
    saveAuditReport(REPORT_PATH, issues);
  });
});
