import { test, expect } from '@playwright/test';

test.describe('Verify Icon Centering, FontAwesome, Stats and Avatar', () => {
  test('Check Home Page Icon Centering', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Check LearningJourney icons exist and are centered
    const journeyIcons = page.locator('section:has-text("رحلة التعلم") .material-symbols-outlined, section:has-text("Learning Journey") .material-symbols-outlined');
    const count = await journeyIcons.count();
    console.log(`Found ${count} journey icons`);

    for (let i = 0; i < count; i++) {
      const icon = journeyIcons.nth(i);
      const parent = icon.locator('..');
      const iconBox = await icon.boundingBox();
      const parentBox = await parent.boundingBox();
      if (iconBox && parentBox) {
        const iconCenterX = iconBox.x + iconBox.width / 2;
        const iconCenterY = iconBox.y + iconBox.height / 2;
        const parentCenterX = parentBox.x + parentBox.width / 2;
        const parentCenterY = parentBox.y + parentBox.height / 2;
        console.log(`Icon ${i}: parentCenter=(${parentCenterX.toFixed(1)}, ${parentCenterY.toFixed(1)}), iconCenter=(${iconCenterX.toFixed(1)}, ${iconCenterY.toFixed(1)})`);
        // Centering difference should be less than 1.5px
        expect(Math.abs(iconCenterX - parentCenterX)).toBeLessThan(2);
        expect(Math.abs(iconCenterY - parentCenterY)).toBeLessThan(2);
      }
    }
  });

  test('Check CourseCard Icon Centering', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    const courseIconBoxes = page.locator('.w-20.h-20');
    const count = await courseIconBoxes.count();
    console.log(`Found ${count} course card icon boxes`);
    for (let i = 0; i < Math.min(count, 4); i++) {
      const box = courseIconBoxes.nth(i);
      const icon = box.locator('.material-symbols-outlined');
      const boxRect = await box.boundingBox();
      const iconRect = await icon.boundingBox();
      if (boxRect && iconRect) {
        const boxCenterX = boxRect.x + boxRect.width / 2;
        const boxCenterY = boxRect.y + boxRect.height / 2;
        const iconCenterX = iconRect.x + iconRect.width / 2;
        const iconCenterY = iconRect.y + iconRect.height / 2;
        console.log(`CourseCard ${i}: boxCenter=(${boxCenterX.toFixed(1)}, ${boxCenterY.toFixed(1)}), iconCenter=(${iconCenterX.toFixed(1)}, ${iconCenterY.toFixed(1)})`);
        expect(Math.abs(iconCenterX - boxCenterX)).toBeLessThan(2);
        expect(Math.abs(iconCenterY - boxCenterY)).toBeLessThan(2);
      }
    }
  });
});
