import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/VoteBox/);
  });

  test('should display logo and app name', async ({ page }) => {
    await expect(page.locator('text=VoteBox').first()).toBeVisible();
  });

  test('should display hero section with CTA buttons', async ({ page }) => {
    // Cast Vote button
    await expect(page.getByRole('link', { name: /szavazás|cast vote|szavazok/i })).toBeVisible();
    // Admin login button
    await expect(page.getByRole('link', { name: /admin|bejelentkezés/i })).toBeVisible();
  });

  test('should have working theme toggle', async ({ page }) => {
    // Find theme toggle button in header
    const headerButtons = page.locator('header button');
    const themeButton = headerButtons.last();
    
    // Get initial state
    const html = page.locator('html');
    const initialDark = await html.evaluate(el => el.classList.contains('dark'));
    
    // Click theme toggle
    await themeButton.click();
    await page.waitForTimeout(100);
    
    // Verify theme changed
    const afterDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(afterDark).not.toBe(initialDark);
  });

  test('should have working language toggle', async ({ page }) => {
    // Get initial language indicator
    const langButton = page.locator('button').filter({ hasText: /HU|EN/i }).first();
    
    if (await langButton.isVisible()) {
      const initialLang = await langButton.textContent();
      await langButton.click();
      
      // Wait for language change
      await page.waitForTimeout(300);
      
      const newLang = await langButton.textContent();
      expect(newLang).not.toBe(initialLang);
    }
  });

  test('should navigate to voter login from CTA', async ({ page }) => {
    await page.getByRole('link', { name: /szavazás|cast vote|szavazok/i }).first().click();
    await expect(page).toHaveURL(/\/vote/);
  });

  test('should navigate to admin login from CTA', async ({ page }) => {
    await page.getByRole('link', { name: /admin|bejelentkezés/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should display feature cards', async ({ page }) => {
    // Check for feature section
    const featureSection = page.locator('section').nth(1);
    await expect(featureSection).toBeVisible();
  });
});
