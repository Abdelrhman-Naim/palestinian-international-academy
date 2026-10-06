import { test, expect } from '@playwright/test';

test.describe('Public Pages & Navigation Suite', () => {
  const publicRoutes = [
    { path: '/', titleKeyword: 'الأكاديمية' },
    { path: '/about', titleKeyword: 'من نحن' },
    { path: '/courses', titleKeyword: 'الدورات' },
    { path: '/library', titleKeyword: 'المكتبة' },
    { path: '/virtual-lab', titleKeyword: 'المختبر' },
    { path: '/contact', titleKeyword: 'تواصل' },
    { path: '/partnerships', titleKeyword: 'الشراكات' },
    { path: '/terms', titleKeyword: 'الشروط' },
    { path: '/privacy', titleKeyword: 'الخصوصية' },
    { path: '/verify-certificate', titleKeyword: 'الشهادة' },
    { path: '/login', titleKeyword: 'تسجيل الدخول' },
    { path: '/login-trainer', titleKeyword: 'تسجيل الدخول' },
    { path: '/login-admin', titleKeyword: 'لوحة التحكم' },
    { path: '/register', titleKeyword: 'إنشاء حساب' },
    { path: '/forgot-password', titleKeyword: 'استعادة' },
  ];

  for (const route of publicRoutes) {
    test(`loads page successfully: ${route.path}`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      // Verify the main container rendered
      await expect(page.locator('body')).toBeVisible();

      // Check no fatal unhandled react errors (excluding expected external font/asset 404s or headless webgl notice)
      const criticalErrors = consoleErrors.filter(
        (err) =>
          !err.includes('favicon') &&
          !err.includes('WebSocket') &&
          !err.includes('net::ERR_') &&
          !err.includes('Failed to load resource') &&
          !err.includes('THREE.WebGLRenderer')
      );
      expect(criticalErrors).toEqual([]);
    });
  }

  test('handles 404 page correctly', async ({ page }) => {
    await page.goto('/some-completely-invalid-route-xyz', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    // Verify 404 message or back button exists
    const backBtn = page.locator('button, a', { hasText: /(الرئيسية|الصفحة السابقة|العودة|Home|Back)/i });
    await expect(backBtn.first()).toBeVisible();
  });
});
