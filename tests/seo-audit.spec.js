import { test, expect } from '@playwright/test';

test.describe('SEO & Metadata Verification Suite', () => {
  test('Static SEO Files Verification (robots.txt, sitemap.xml, llms.txt, manifest)', async ({ request }) => {
    // 1. Verify robots.txt
    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain('User-agent: *');
    expect(robotsText).toContain('GPTBot');
    expect(robotsText).toContain('ClaudeBot');
    expect(robotsText).toContain('PerplexityBot');
    expect(robotsText).toContain('sitemap.xml');
    expect(robotsText).toContain('Disallow: /admin-dashboard/');

    // 2. Verify sitemap.xml
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapText = await sitemapRes.text();
    expect(sitemapText).toContain('<?xml');
    expect(sitemapText).toContain('https://palestine-international-academy.netlify.app/');
    expect(sitemapText).toContain('/courses');
    expect(sitemapText).toContain('/library');
    expect(sitemapText).toContain('lastmod');

    // 3. Verify llms.txt (GEO standard)
    const llmsRes = await request.get('/llms.txt');
    expect(llmsRes.status()).toBe(200);
    const llmsText = await llmsRes.text();
    expect(llmsText).toContain('Palestinian International Academy');
    expect(llmsText).toContain('https://palestine-international-academy.netlify.app/');

    // 4. Verify site.webmanifest
    const manifestRes = await request.get('/site.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.name).toContain('Palestinian International Academy');
    expect(manifestJson.theme_color).toBe('#D4AF37');
  });

  test('Dynamic Head SEO Tags & JSON-LD on Public Pages', async ({ page }) => {
    // Check Home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    expect(title).toMatch(/أكاديمية فلسطين الدولية|Palestinian International Academy/);

    const desc = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc?.length).toBeGreaterThan(20);

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('https://palestine-international-academy.netlify.app');

    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    expect(ogTitle).toBeTruthy();

    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(ogImage).toContain('palestine-international-academy.netlify.app');

    // Verify JSON-LD Schema
    const jsonLdCount = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(1);

    const jsonLdContent = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(jsonLdContent || '{}');
    expect(parsed['@context']).toBe('https://schema.org');

    // Check Courses page
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const coursesTitle = await page.title();
    expect(coursesTitle).toMatch(/الدورات|Courses/);

    // Check About page
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const aboutTitle = await page.title();
    expect(aboutTitle).toMatch(/من نحن|About/);
  });
});
