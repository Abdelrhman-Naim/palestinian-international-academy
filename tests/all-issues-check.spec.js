import { test, expect } from '@playwright/test';

test.describe('Verify All 4 Fixes', () => {
  test.setTimeout(90000);

  test('1. Check LearningJourney & CourseCard Icons Centering', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Check LearningJourney Section
    const journeySection = page.locator('section').filter({ hasText: /رحلة التعلّم/i });
    await expect(journeySection).toBeVisible({ timeout: 15000 });

    const journeyIconBoxes = journeySection.locator('.w-12.h-12');
    await expect(journeyIconBoxes.first()).toBeVisible({ timeout: 15000 });
    const jCount = await journeyIconBoxes.count();
    console.log(`Found ${jCount} Journey icon boxes`);
    expect(jCount).toBe(4);

    for (let i = 0; i < jCount; i++) {
      const box = journeyIconBoxes.nth(i);
      const icon = box.locator('.material-symbols-outlined');
      const boxRect = await box.boundingBox();
      const iconRect = await icon.boundingBox();

      expect(boxRect).toBeTruthy();
      expect(iconRect).toBeTruthy();

      const boxCenterX = boxRect.x + boxRect.width / 2;
      const boxCenterY = boxRect.y + boxRect.height / 2;
      const iconCenterX = iconRect.x + iconRect.width / 2;
      const iconCenterY = iconRect.y + iconRect.height / 2;

      console.log(`Journey Icon ${i}: BoxCenter=(${boxCenterX.toFixed(1)}, ${boxCenterY.toFixed(1)}), IconCenter=(${iconCenterX.toFixed(1)}, ${iconCenterY.toFixed(1)})`);

      // Centered precisely within 1.5 pixels
      expect(Math.abs(boxCenterX - iconCenterX)).toBeLessThan(1.5);
      expect(Math.abs(boxCenterY - iconCenterY)).toBeLessThan(1.5);
    }

    // Check CourseCard on PopularCourses (Home Page)
    const popularCourseBox = page.locator('.w-20.h-20:has(.material-symbols-outlined)').first();
    await expect(popularCourseBox).toBeVisible({ timeout: 15000 });

    const pBoxRect = await popularCourseBox.boundingBox();
    const pIcon = popularCourseBox.locator('.material-symbols-outlined');
    const pIconRect = await pIcon.boundingBox();

    expect(pBoxRect).toBeTruthy();
    expect(pIconRect).toBeTruthy();

    const pBoxCenterX = pBoxRect.x + pBoxRect.width / 2;
    const pBoxCenterY = pBoxRect.y + pBoxRect.height / 2;
    const pIconCenterX = pIconRect.x + pIconRect.width / 2;
    const pIconCenterY = pIconRect.y + pIconRect.height / 2;

    console.log(`Popular CourseCard: BoxCenter=(${pBoxCenterX.toFixed(1)}, ${pBoxCenterY.toFixed(1)}), IconCenter=(${pIconCenterX.toFixed(1)}, ${pIconCenterY.toFixed(1)})`);
    expect(Math.abs(pIconCenterX - pBoxCenterX)).toBeLessThan(1.5);
    expect(Math.abs(pIconCenterY - pBoxCenterY)).toBeLessThan(1.5);

    // Also check on /courses page
    await page.goto('/courses', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const courseCardIcon = page.locator('.w-20.h-20:has(.material-symbols-outlined)').first();
    await expect(courseCardIcon).toBeVisible({ timeout: 15000 });

    const cRect = await courseCardIcon.boundingBox();
    const cIconRect = await courseCardIcon.locator('.material-symbols-outlined').boundingBox();
    expect(cRect).toBeTruthy();
    expect(cIconRect).toBeTruthy();

    const cCenterX = cRect.x + cRect.width / 2;
    const cCenterY = cRect.y + cRect.height / 2;
    const ciCenterX = cIconRect.x + cIconRect.width / 2;
    const ciCenterY = cIconRect.y + cIconRect.height / 2;
    console.log(`Courses Page Icon: BoxCenter=(${cCenterX.toFixed(1)}, ${cCenterY.toFixed(1)}), IconCenter=(${ciCenterX.toFixed(1)}, ${ciCenterY.toFixed(1)})`);
    expect(Math.abs(ciCenterX - cCenterX)).toBeLessThan(1.5);
    expect(Math.abs(ciCenterY - cCenterY)).toBeLessThan(1.5);
  });

  test('2. Check Student Dashboard Icons & FontAwesome Render', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill('abood12.e.m@gmail.com');
    await passwordInput.fill('123123');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 35000 });
    await page.waitForTimeout(2000);

    // 2. Check Student Overview FontAwesome icons
    const faGraduation = page.locator('.w-10.h-10 i.fa-graduation-cap, i.fa-graduation-cap.text-lg').first();
    const faAward = page.locator('.w-10.h-10 i.fa-award, i.fa-award.text-lg').first();
    const faListCheck = page.locator('.w-10.h-10 i.fa-list-check, i.fa-list-check.text-lg').first();

    await expect(faGraduation).toBeVisible({ timeout: 15000 });
    await expect(faAward).toBeVisible({ timeout: 15000 });
    await expect(faListCheck).toBeVisible({ timeout: 15000 });

    const gradBox = await faGraduation.boundingBox();
    console.log('fa-graduation-cap rendered size:', gradBox);
    expect(gradBox.width).toBeGreaterThan(8);
    expect(gradBox.height).toBeGreaterThan(8);

    // 3. Check Sidebar FontAwesome icons
    const sidebarFa = page.locator('aside i.fa-solid, aside i.fa-regular');
    const sidebarCount = await sidebarFa.count();
    console.log(`Found ${sidebarCount} sidebar FA icons`);
    expect(sidebarCount).toBeGreaterThan(5);

    // 4. Go to student profile and verify enrolled courses stat
    await page.goto('/dashboard/profile', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const studentAvatar = page.locator('.w-24.h-24, .w-28.h-28').first();
    await expect(studentAvatar).toBeVisible({ timeout: 15000 });

    const coursesStat = page.locator('text=/دورات مسجلة|Enrolled Courses/');
    await expect(coursesStat).toBeVisible({ timeout: 15000 });
  });

  test('3. Check Admin Profile Stats (>1000 books) & Clean Rounded Avatar', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login-admin', { waitUntil: 'commit', timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const usernameInput = page.locator('#admin-user');
    const passwordInput = page.locator('#admin-pass');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await usernameInput.fill('admin@gmail.com');
    await passwordInput.fill('Admin@2005');
    await submitBtn.click();

    await expect(page).toHaveURL(/\/admin-dashboard/, { timeout: 35000 });
    await page.waitForTimeout(2000);

    // 2. Go to Admin Profile
    await page.goto('/admin-dashboard/profile', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // 3. Check Books Stat: wait until stats fetch finishes and displays 1381
    const booksStatVal = page.locator('div:has(> span:text-is("الكتب")), div:has(> span:text-is("Library Books"))').locator('span.text-lg.font-black');
    await expect(booksStatVal).toBeVisible({ timeout: 20000 });
    await expect(booksStatVal).not.toHaveText('0', { timeout: 15000 });

    const booksText = await booksStatVal.textContent();
    console.log('Admin Profile Books Stat:', booksText);
    const booksNum = parseInt(booksText?.trim() || '0', 10);
    expect(booksNum).toBeGreaterThan(1000);

    // 4. Check Avatar is rounded-full and clean
    const avatarContainer = page.locator('.w-24.h-24.rounded-full, .w-28.h-28.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 10000 });

    // Verify initials are displayed cleanly without red corruption
    const initialsSpan = avatarContainer.locator('span').first();
    await expect(initialsSpan).toBeVisible();
    const initialsText = await initialsSpan.textContent();
    console.log('Admin Initials:', initialsText);
    expect(initialsText).toBeTruthy();

    // Verify avatar content is clean and displayed properly
    const imgInside = avatarContainer.locator('img');
    const imgCount = await imgInside.count();
    if (imgCount > 0) {
      await expect(imgInside.first()).toBeVisible();
      const src = await imgInside.first().getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).not.toContain('FA8072'); // Ensure old red block is not used
    } else {
      await expect(initialsSpan).toBeVisible();
    }
  });
});
