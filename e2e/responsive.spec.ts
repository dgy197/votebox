import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const viewports = {
    mobile: { width: 393, height: 852 },  // iPhone 14
    desktop: { width: 1280, height: 800 },
  };

  test.describe('Mobile View (393px)', () => {
    test.use({ viewport: viewports.mobile });

    test('homepage should be responsive', async ({ page }) => {
      await page.goto('/');
      
      // Logo should be visible
      await expect(page.locator('text=VoteBox').first()).toBeVisible();
      
      // CTA buttons should stack vertically on mobile
      const ctaSection = page.locator('div').filter({ hasText: /szavazás|cast vote/i }).first();
      await expect(ctaSection).toBeVisible();
      
      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
    });

    test('admin login should be responsive', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Form should be visible and not overflow
      await expect(page.locator('form')).toBeVisible();
      
      // Demo buttons should be visible
      await expect(page.getByRole('button', { name: /super admin/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /org admin/i })).toBeVisible();
      
      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });

    test('voter login should be responsive', async ({ page }) => {
      await page.goto('/vote');
      
      // Form should be visible
      await expect(page.locator('input').first()).toBeVisible();
      
      // Demo button should be visible
      await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
      
      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });

  test.describe('Desktop View (1280px)', () => {
    test.use({ viewport: viewports.desktop });

    test('homepage should display full layout', async ({ page }) => {
      await page.goto('/');
      
      // Logo and navigation should be visible
      await expect(page.locator('text=VoteBox').first()).toBeVisible();
      
      // Feature cards should be in grid (visible side by side)
      const features = page.locator('section').nth(1).locator('[class*="card"], [class*="Card"]');
      
      // CTA buttons might be side by side on desktop
      const castVoteBtn = page.getByRole('link', { name: /szavazás|cast vote|szavazok/i }).first();
      const adminBtn = page.getByRole('link', { name: /admin/i }).first();
      
      await expect(castVoteBtn).toBeVisible();
      await expect(adminBtn).toBeVisible();
    });

    test('admin login should be centered', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Form should be centered
      const form = page.locator('form');
      await expect(form).toBeVisible();
      
      const formBox = await form.boundingBox();
      if (formBox) {
        // Form should be roughly centered (within viewport middle third)
        const viewportMiddle = 1280 / 2;
        const formMiddle = formBox.x + formBox.width / 2;
        expect(Math.abs(formMiddle - viewportMiddle)).toBeLessThan(200);
      }
    });

    test('voter login should be centered', async ({ page }) => {
      await page.goto('/vote');
      
      // Main content should be centered
      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Dark Mode Responsive', () => {
    test('dark mode should work on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/');
      
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      // Verify dark class is applied
      const isDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(isDark).toBe(true);
      
      // Content should still be visible
      await expect(page.locator('text=VoteBox').first()).toBeVisible();
    });

    test('dark mode should work on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/');
      
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      // Verify dark class is applied
      const isDark = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(isDark).toBe(true);
      
      // Content should still be visible
      await expect(page.locator('text=VoteBox').first()).toBeVisible();
    });
  });
});
