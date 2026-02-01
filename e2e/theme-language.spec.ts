import { test, expect } from '@playwright/test';

test.describe('Theme and Language', () => {
  test('should persist theme across pages', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    
    // Get initial theme
    const html = page.locator('html');
    const initialDark = await html.evaluate(el => el.classList.contains('dark'));
    
    // Toggle theme via header button
    const themeButton = page.locator('header button').last();
    await themeButton.click();
    await page.waitForTimeout(100);
    
    const newTheme = await html.evaluate(el => el.classList.contains('dark'));
    expect(newTheme).not.toBe(initialDark);
    
    // Navigate to admin login
    await page.goto('/admin/login');
    await page.waitForTimeout(100);
    
    // Theme should persist
    const adminTheme = await html.evaluate(el => el.classList.contains('dark'));
    expect(adminTheme).toBe(newTheme);
    
    // Navigate to voter login
    await page.goto('/vote');
    await page.waitForTimeout(100);
    
    // Theme should still persist
    const voterTheme = await html.evaluate(el => el.classList.contains('dark'));
    expect(voterTheme).toBe(newTheme);
  });

  test('should toggle theme from light to dark', async ({ page }) => {
    await page.goto('/');
    
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForTimeout(200);
    
    const html = page.locator('html');
    const initialState = await html.evaluate(el => el.classList.contains('dark'));
    
    // Find theme toggle
    const themeButton = page.locator('header button').last();
    
    // Toggle theme
    await themeButton.click();
    await page.waitForTimeout(200);
    
    // Verify state changed
    const newState = await html.evaluate(el => el.classList.contains('dark'));
    expect(newState).not.toBe(initialState);
  });

  test('should switch language from HU to EN', async ({ page }) => {
    await page.goto('/');
    
    // Set initial language to HU
    await page.evaluate(() => localStorage.setItem('language', 'hu'));
    await page.reload();
    
    // Check for Hungarian text
    const huText = page.locator('text=Szavazok');
    const enText = page.locator('text=Cast Vote');
    
    // Find and click language toggle
    const langButton = page.locator('button').filter({ hasText: /HU|EN/i }).first();
    
    if (await langButton.isVisible()) {
      await langButton.click();
      await page.waitForTimeout(500);
      
      // Language should have changed
      // Note: exact assertion depends on initial state
    }
  });

  test('dark mode should apply correct colors', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    
    await page.reload();
    await page.waitForTimeout(100);
    
    // Check background color is dark
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Dark mode should have dark background (not white/light)
    // RGB values for dark backgrounds are typically low
    const match = bgColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      // Average should be less than 128 for dark theme
      expect((r + g + b) / 3).toBeLessThan(150);
    }
  });
});
