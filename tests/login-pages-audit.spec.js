import { test, expect } from '@playwright/test';

test.describe('Login & Auth Pages Comprehensive Audit', () => {
  test.setTimeout(60000);

  test('All login pages render without console 400 or ChunkLoadError', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pagesToTest = ['/login', '/login-trainer', '/login-admin', '/register'];

    for (const url of pagesToTest) {
      await page.goto(url, { waitUntil: 'commit' });
      await page.waitForLoadState('domcontentloaded');

      // Verify form elements exist
      await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button[type="submit"]').first()).toBeVisible({ timeout: 10000 });
    }

    // Check no ChunkLoadError or 400 Bad Request occurred
    const chunkErrors = consoleErrors.filter(err => 
      err.includes('ChunkLoadError') || err.includes('status of 400')
    );
    expect(chunkErrors).toEqual([]);
  });

  test('Admin login with username "admin" shortcut', async ({ page }) => {
    await page.goto('/login-admin', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    const usernameInput = page.locator('#admin-user, input[type="text"]');
    const passwordInput = page.locator('#admin-pass, input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Fill "admin" instead of full email
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@2005');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/admin-dashboard/, { timeout: 25000 });
  });

  test('Regular login rejects non-existent credentials gracefully without crash', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input#email, input[type="email"]');
    const passwordInput = page.locator('input#password, input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill('nonexistent_user_999@example.com');
    await passwordInput.fill('WrongPassword123');
    await submitBtn.click();

    // Verify error notification
    const errorBox = page.locator('div:has-text("البريد الإلكتروني أو كلمة المرور غير صحيحة"), div:has-text("Invalid email or password")');
    await expect(errorBox.first()).toBeVisible({ timeout: 15000 });
  });
});
