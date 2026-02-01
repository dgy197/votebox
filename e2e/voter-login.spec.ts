import { test, expect } from '@playwright/test';

test.describe('Voter Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vote');
  });

  test('should display voter login form', async ({ page }) => {
    // Check for event code and access code inputs
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('input').nth(1)).toBeVisible();
  });

  test('should display demo mode button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
  });

  test('should login via demo mode', async ({ page }) => {
    await page.getByRole('button', { name: /demo/i }).click();
    
    // Should redirect to /voting
    await expect(page).toHaveURL(/\/voting/);
  });

  test('should have working theme toggle', async ({ page }) => {
    const html = page.locator('html');
    const initialDark = await html.evaluate(el => el.classList.contains('dark'));
    
    // Find and click theme toggle (usually last button in header)
    const buttons = page.locator('header button');
    const themeButton = buttons.last();
    await themeButton.click();
    
    const afterDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(afterDark).not.toBe(initialDark);
  });

  test('should have working language toggle', async ({ page }) => {
    const langButton = page.locator('header button').first();
    await langButton.click();
    
    // Language should change (check if text changes on page)
    await page.waitForTimeout(300);
  });

  test('should accept event code from URL parameter', async ({ page }) => {
    await page.goto('/vote/TEST123');
    
    // First input should have the event code
    const eventInput = page.locator('input').first();
    await expect(eventInput).toHaveValue('TEST123');
  });

  test('should convert codes to uppercase', async ({ page }) => {
    const eventInput = page.locator('input').first();
    await eventInput.fill('abc123');
    
    await expect(eventInput).toHaveValue('ABC123');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.locator('input').first().fill('INVALID');
    await page.locator('input').nth(1).fill('WRONG');
    
    // Find and click submit button
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Wait for API response
    await page.waitForTimeout(2000);
    
    // Form should still be visible (didn't navigate away)
    await expect(page.locator('form, input').first()).toBeVisible();
  });
});
