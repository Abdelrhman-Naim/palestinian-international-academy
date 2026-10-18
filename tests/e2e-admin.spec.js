import { test, expect } from '@playwright/test';
import { setupPageLogger, saveAuditReport } from './utils/auditLogger.js';

test.describe('Admin Full E2E & Debug Audit', () => {
  test.setTimeout(180000);
  const REPORT_PATH = 'test-results/audit-report.json';
  let issues = [];

  test.afterEach(() => {
    saveAuditReport(REPORT_PATH, issues);
  });

  test('Admin Authentication & All Sub-Pages Navigation', async ({ page }) => {
    issues = setupPageLogger(page, 'Admin Dashboard Audit');

    // 1. Go to Admin Login page
    await page.goto('/login-admin', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');

    // 2. Fill admin credentials
    const usernameInput = page.locator('#admin-user, input[type="text"]');
    const passwordInput = page.locator('#admin-pass, input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await usernameInput.fill('admin@gmail.com');
    await passwordInput.fill('Admin@2005');
    await submitBtn.click();

    // 3. Verify successful redirection to /admin-dashboard
    await expect(page).toHaveURL(/\/admin-dashboard/, { timeout: 35000 });
    await page.waitForTimeout(2000);

    // List of all Admin Dashboard Sub-Routes to audit
    const adminRoutes = [
      { name: 'Admin Overview', path: '/admin-dashboard' },
      { name: 'Admin Requests', path: '/admin-dashboard/requests' },
      { name: 'Admin Instructors', path: '/admin-dashboard/instructors' },
      { name: 'Admin Users', path: '/admin-dashboard/users' },
      { name: 'Admin Courses', path: '/admin-dashboard/courses' },
      { name: 'Admin Course Categories', path: '/admin-dashboard/categories' },
      { name: 'Admin Library Books', path: '/admin-dashboard/library' },
      { name: 'Admin Add Book', path: '/admin-dashboard/add-book' },
      { name: 'Admin Library Categories', path: '/admin-dashboard/library-categories' },
      { name: 'Admin Settings', path: '/admin-dashboard/settings' },
      { name: 'Admin Activity Logs', path: '/admin-dashboard/activity-logs' },
      { name: 'Admin Contact Messages', path: '/admin-dashboard/contact-messages' },
      { name: 'Admin Profile', path: '/admin-dashboard/profile' },
      { name: 'Admin Messages', path: '/admin-dashboard/messages' },
    ];

    for (const route of adminRoutes) {
      console.log(`Auditing ${route.name} (${route.path})...`);
      await page.goto(route.path, { waitUntil: 'commit', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Verify that the page loaded without crashing to error boundary or white screen
      const pageHeading = page.locator('h1, h2, h3').first();
      await expect(pageHeading).toBeVisible({ timeout: 10000 });
    }
  });

  test('Sidebar highlights only one item when navigating to library categories', async ({ page }) => {
    // 1. Login
    await page.goto('/login-admin', { waitUntil: 'commit', timeout: 45000 });
    const usernameInput = page.locator('#admin-user, input[type="text"]');
    const passwordInput = page.locator('#admin-pass, input[type="password"]');
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await usernameInput.fill('admin@gmail.com');
    await passwordInput.fill('Admin@2005');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin-dashboard/, { timeout: 35000 });

    // 2. Go to Library Categories
    await page.goto('/admin-dashboard/library-categories', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(1000);

    const libContentLink = page.locator('aside a[href="/admin-dashboard/library"]');
    const libCatsLink = page.locator('aside a[href="/admin-dashboard/library-categories"]');

    // Only libCatsLink must have bg-primary, libContentLink must NOT have bg-primary
    await expect(libCatsLink).toHaveClass(/bg-primary/);
    await expect(libContentLink).not.toHaveClass(/bg-primary/);
  });
});
