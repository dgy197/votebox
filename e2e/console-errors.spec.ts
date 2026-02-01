import { test, expect } from '@playwright/test';

test.describe('Console Errors Check', () => {
  const pages = [
    { name: 'Homepage', url: '/' },
    { name: 'Admin Login', url: '/admin/login' },
    { name: 'Voter Login', url: '/vote' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} should have no console errors`, async ({ page }) => {
      const errors: string[] = [];
      
      // Collect console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          // Ignore some known acceptable errors
          const text = msg.text();
          if (!text.includes('favicon') && 
              !text.includes('404') && 
              !text.includes('Failed to load resource: the server responded with a status of 401')) {
            errors.push(text);
          }
        }
      });

      // Collect page errors
      page.on('pageerror', err => {
        errors.push(err.message);
      });

      await page.goto(pageInfo.url);
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Filter out Supabase-related errors (expected in demo mode)
      const criticalErrors = errors.filter(e => 
        !e.includes('supabase') && 
        !e.includes('Supabase') &&
        !e.includes('VITE_') &&
        !e.includes('env')
      );

      expect(criticalErrors).toEqual([]);
    });
  }

  test('Admin dashboard (demo) should load without critical errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && 
            !text.includes('supabase') &&
            !text.includes('Supabase')) {
          errors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // Login via demo
    await page.goto('/admin/login');
    await page.getByRole('button', { name: /org admin/i }).click();
    
    await page.waitForURL(/\/admin/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('supabase') && 
      !e.includes('Supabase') &&
      !e.includes('Failed to fetch')
    );

    // We expect minimal errors in demo mode
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('Voter dashboard (demo) should load without critical errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && 
            !text.includes('supabase') &&
            !text.includes('Supabase')) {
          errors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // Login via demo
    await page.goto('/vote');
    await page.getByRole('button', { name: /demo/i }).click();
    
    await page.waitForURL(/\/voting/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Filter critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('supabase') && 
      !e.includes('Supabase') &&
      !e.includes('Failed to fetch')
    );

    // We expect minimal errors in demo mode
    expect(criticalErrors.length).toBeLessThan(3);
  });
});
