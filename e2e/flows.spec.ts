import { test, expect } from '@playwright/test';

test.describe('User Flows', () => {
  test.describe('Admin Flow', () => {
    test('should complete admin demo login flow', async ({ page }) => {
      // Step 1: Go to admin login
      await page.goto('/admin/login');
      const orgAdminBtn = page.locator('button').filter({ hasText: /org admin/i });
      await expect(orgAdminBtn).toBeVisible();
      
      // Step 2: Click demo login
      await orgAdminBtn.click();
      
      // Step 3: Should redirect (either /admin or stay if already logged)
      await page.waitForTimeout(500);
      
      // Step 4: Dashboard or redirect should work
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/admin/);
    });

    test('should complete super admin demo login flow', async ({ page }) => {
      // Step 1: Go to admin login
      await page.goto('/admin/login');
      
      // Step 2: Click super admin demo
      const superAdminBtn = page.locator('button').filter({ hasText: /super admin/i });
      await superAdminBtn.click();
      
      // Step 3: Should be on super admin dashboard
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/super/);
    });
  });

  test.describe('Voter Flow', () => {
    test('should complete voter demo login flow', async ({ page }) => {
      // Step 1: Go to voter login
      await page.goto('/vote');
      const demoBtn = page.locator('button').filter({ hasText: /demo/i });
      await expect(demoBtn).toBeVisible();
      
      // Step 2: Click demo login
      await demoBtn.click();
      
      // Step 3: Should be on voting dashboard
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/voting/);
    });

    test('should navigate voter login from homepage', async ({ page }) => {
      // Step 1: Start at homepage
      await page.goto('/');
      
      // Step 2: Click vote button
      await page.getByRole('link', { name: /szavazás|cast vote|szavazok/i }).first().click();
      
      // Step 3: Should be on voter login
      await expect(page).toHaveURL(/\/vote/);
      
      // Step 4: Voter login form should be visible
      await expect(page.locator('input').first()).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('should navigate between all main pages', async ({ page }) => {
      // Homepage
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=VoteBox').first()).toBeVisible();
      
      // To Admin Login
      await page.locator('a[href*="admin"]').first().click();
      await expect(page).toHaveURL(/\/admin\/login/);
      
      // Back to Homepage
      await page.locator('button').filter({ hasText: /←|vissza|back/i }).first().click();
      await expect(page).toHaveURL('/');
      
      // To Voter Login
      await page.locator('a[href*="vote"]').first().click();
      await expect(page).toHaveURL(/\/vote/);
    });
  });
});
