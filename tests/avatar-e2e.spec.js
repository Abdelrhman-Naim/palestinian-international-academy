import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Avatar Upload & Display Across Header, Profile, and Sidebar', () => {
  test.setTimeout(90000);

  test('Upload avatar and verify persistence across all 3 locations and reloads', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login-admin', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    const usernameInput = page.locator('#admin-user, input[type="text"]');
    const passwordInput = page.locator('#admin-pass, input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await usernameInput.fill('admin@gmail.com');
    await passwordInput.fill('Admin@2005');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/admin-dashboard/, { timeout: 30000 });

    // 2. Go to Profile Page
    await page.goto('/admin-dashboard/profile', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    // 3. Upload Avatar via file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await expect(fileInput).toBeAttached();

    const testImagePath = path.resolve('tests/fixtures/test-avatar.png');
    await fileInput.setInputFiles(testImagePath);

    // 4. Verify Success Toast
    const successToast = page.locator('text=/تم تحديث الصورة الشخصية بنجاح|Avatar updated successfully/i');
    await expect(successToast).toBeVisible({ timeout: 15000 });

    // 5. Verify Avatar Location #1: Admin Profile Card
    const profileAvatarImg = page.locator('.w-24.h-24 img, .w-28.h-28 img').first();
    await expect(profileAvatarImg).toBeVisible({ timeout: 10000 });
    const profileSrc = await profileAvatarImg.getAttribute('src');
    expect(profileSrc).toBeTruthy();

    // 6. Verify Avatar Location #2: Admin Dashboard Sidebar
    const sidebarAvatarImg = page.locator('aside a[href*="profile"] img').first();
    await expect(sidebarAvatarImg).toBeVisible({ timeout: 10000 });
    const sidebarSrc = await sidebarAvatarImg.getAttribute('src');
    expect(sidebarSrc).toBeTruthy();

    // 7. Verify Avatar Location #3: Main Website Header (Navbar) on Public Home Page
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    const navbarAvatarImg = page.locator('header button[aria-label*="userMenu"] img, header button[aria-label*="المستخدم"] img, header .w-10.h-10 img').first();
    await expect(navbarAvatarImg).toBeVisible({ timeout: 15000 });
    const navbarSrc = await navbarAvatarImg.getAttribute('src');
    expect(navbarSrc).toBeTruthy();

    // 8. Refresh Public Page and Verify Avatar Stays in Navbar
    await page.reload({ waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    await expect(navbarAvatarImg).toBeVisible({ timeout: 15000 });

    // 9. Navigate back to /admin-dashboard/profile and Refresh
    await page.goto('/admin-dashboard/profile', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    await page.reload({ waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');

    // Verify avatar is still visible in Profile & Sidebar after page reload
    await expect(page.locator('.w-24.h-24 img, .w-28.h-28 img').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('aside a[href*="profile"] img').first()).toBeVisible({ timeout: 15000 });
  });
});
