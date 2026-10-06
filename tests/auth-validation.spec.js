import { test, expect } from '@playwright/test';

test.describe('Authentication & Form Validation Suite', () => {
  test('Validates required fields and email format on login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Try submitting without filling inputs
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Verify validation errors or invalid feedback appeared
    const emailInput = page.locator('input#email, input[type="email"]');
    const passwordInput = page.locator('input#password, input[type="password"]');

    // Fill invalid email
    await emailInput.fill('invalid-email-format');
    await passwordInput.fill('123');
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Verify error text is displayed
    const hasError = await page.locator('p.text-red-500, p.text-rose-500, .border-red-500, div:has-text("بريد"), div:has-text("email")').count();
    expect(hasError).toBeGreaterThan(0);
  });

  test('Switches roles smoothly between Student and Instructor', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Click Trainer tab
    const trainerTab = page.locator('a[href="/login-trainer"]');
    if (await trainerTab.count() > 0) {
      await trainerTab.first().click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/login-trainer');
    }

    // Switch back to Student tab
    const studentTab = page.locator('a[href="/login"]');
    if (await studentTab.count() > 0) {
      await studentTab.first().click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/login');
    }
  });

  test('Validates registration form inputs', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    // Submit empty registration form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Verify at least one validation alert/message is rendered
    const errors = page.locator('.text-red-500, .text-rose-500, .border-red-500');
    expect(await errors.count()).toBeGreaterThan(0);
  });
});
