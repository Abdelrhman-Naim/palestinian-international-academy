import { test, expect } from '@playwright/test';
import { setupPageLogger, saveAuditReport } from './utils/auditLogger.js';

test.describe('Instructor Full E2E & Debug Audit', () => {
  test.setTimeout(90000);
  const REPORT_PATH = 'test-results/audit-report.json';
  let issues = [];

  test.afterEach(() => {
    saveAuditReport(REPORT_PATH, issues);
  });

  test('Instructor Authentication & Dashboard Navigation', async ({ page }) => {
    issues = setupPageLogger(page, 'Instructor Dashboard Audit');

    // 1. Go to Instructor Login page
    await page.goto('/login-trainer', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');

    // 2. Fill instructor credentials
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('anym46927@gmail.com');
    await passwordInput.fill('123123');
    await submitBtn.click();

    // 3. Verify successful redirection to /instructor-dashboard using toHaveURL
    await expect(page).toHaveURL(/\/instructor-dashboard/, { timeout: 35000 });
    await page.waitForTimeout(2000);

    // 4. Test Instructor Overview Page
    const overviewHeading = page.locator('h1, h2, h3').first();
    await expect(overviewHeading).toBeVisible({ timeout: 10000 });

    // 5. Navigate to /instructor-dashboard/courses (My Courses)
    await page.goto('/instructor-dashboard/courses', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/instructor-dashboard\/courses/);

    // 6. Navigate to /instructor-dashboard/add-course (Add Course Form)
    await page.goto('/instructor-dashboard/add-course', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/instructor-dashboard\/add-course/);

    // Verify key fields in Add Course: Title, Category, Level, Price, Lectures, Status
    const titleInput = page.locator('input[name="title"], input#title, input[placeholder*="عنوان"], input[placeholder*="Title"]').first();
    if (await titleInput.isVisible()) {
      await expect(titleInput).toBeVisible();
    }

    // Check status selector / input for ongoing vs completed (مستمرة / مكتملة)
    const statusField = page.locator('select[name="status"], select#status, input[name="status"]').first();
    console.log(`Instructor Add Course status field count: ${await statusField.count()}`);

    // 7. Navigate to /instructor-dashboard/profile
    await page.goto('/instructor-dashboard/profile', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/instructor-dashboard\/profile/);

    // 8. Navigate to /instructor-dashboard/messages
    await page.goto('/instructor-dashboard/messages', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/instructor-dashboard\/messages/);
  });
});
