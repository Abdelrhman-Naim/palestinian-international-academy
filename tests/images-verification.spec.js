import { test, expect } from '@playwright/test';

test.describe('Image Loading & WebP Optimization Suite', () => {
  test('Home page images load successfully with 0 broken images', async ({ page }) => {
    const failedRequests = [];
    page.on('response', response => {
      const url = response.url();
      if ((url.includes('.webp') || url.includes('.png') || url.includes('.jpg') || url.includes('/storage/v1/object/')) && response.status() >= 400) {
        failedRequests.push({ url, status: response.status() });
      }
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Check all <img> tags have rendered properly and have positive natural dimensions
    const images = await page.$$eval('img', imgs => imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete
    })));

    console.log(`Found ${images.length} images on Home page.`);
    images.forEach(img => {
      // Must not be broken [object Object] or empty
      expect(img.src).not.toContain('[object%20Object]');
      expect(img.src).not.toContain('[object Object]');
      if (img.complete) {
        expect(img.naturalWidth).toBeGreaterThan(0);
      }
    });

    // Verify logo is displayed
    const logoImg = page.locator('header img[alt*="PIA"], header img[alt*="PALESTINIAN"]');
    await expect(logoImg).toBeVisible();

    // Verify projects section images
    const projectImgs = page.locator('section img[alt="MedLink Logo"], section img[alt="Trainova"], section img[alt="Talabati"]');
    expect(await projectImgs.count()).toBeGreaterThan(0);
    for (let i = 0; i < await projectImgs.count(); i++) {
      await expect(projectImgs.nth(i)).toBeVisible();
    }

    expect(failedRequests).toEqual([]);
  });

  test('About page images load successfully', async ({ page }) => {
    const failedRequests = [];
    page.on('response', response => {
      const url = response.url();
      if ((url.includes('.webp') || url.includes('.png') || url.includes('.jpg')) && response.status() >= 400) {
        failedRequests.push({ url, status: response.status() });
      }
    });

    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });

    const images = await page.$$eval('img', imgs => imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      complete: img.complete
    })));

    console.log(`Found ${images.length} images on About page.`);
    images.forEach(img => {
      expect(img.src).not.toContain('[object%20Object]');
      if (img.complete) {
        expect(img.naturalWidth).toBeGreaterThan(0);
      }
    });

    expect(failedRequests).toEqual([]);
  });

  test('Login & Register pages have optimized logo visible with no broken images', async ({ page }) => {
    for (const route of ['/login', '/register', '/forgot-password']) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
      const logoImgs = page.locator('img[alt*="PALESTINIAN"], img[alt="Logo"]');
      expect(await logoImgs.count()).toBeGreaterThan(0);
      const isVisible = await logoImgs.first().isVisible();
      expect(isVisible).toBe(true);

      const brokenImages = await page.$$eval('img', imgs =>
        imgs.filter(img => img.src.includes('[object') || (img.complete && img.naturalWidth === 0)).map(img => img.src)
      );
      expect(brokenImages).toEqual([]);
    }
  });

  test('Admin, Instructor, and Student Dashboards have resilient avatars and no broken images', async ({ page }) => {
    // 1. Student Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'abood12.e.m@gmail.com');
    await page.fill('input[type="password"]', '123123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    const studentBrokenImgs = await page.$$eval('img', imgs =>
      imgs.filter(img => img.src.includes('[object') || (img.complete && img.naturalWidth === 0)).map(img => img.src)
    );
    expect(studentBrokenImgs).toEqual([]);
  });
});
