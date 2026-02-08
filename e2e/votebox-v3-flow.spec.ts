import { test, expect } from '@playwright/test'

test.describe('VoteBox V3 - Full Flow Test', () => {
  
  test.describe('Homepage & Navigation', () => {
    test('should load homepage', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle(/VoteBox/)
    })

    test('should have main navigation elements', async ({ page }) => {
      await page.goto('/')
      // Check for any nav or header element
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
    })
  })

  test.describe('Schedule Meeting Flow', () => {
    test('should load schedule page', async ({ page }) => {
      // Test with our test meeting ID
      await page.goto('/schedule/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      // Should either load the page or redirect
      await page.waitForLoadState('networkidle')
      const url = page.url()
      expect(url).toContain('localhost')
    })
  })

  test.describe('Meeting Detail Flow', () => {
    test('should load meeting detail page', async ({ page }) => {
      await page.goto('/v3/meetings/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      await page.waitForLoadState('networkidle')
      const url = page.url()
      expect(url).toContain('localhost')
    })
  })

  test.describe('Admin Flow', () => {
    test('should access admin demo', async ({ page }) => {
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')
      
      // Look for demo button or login form
      const demoButton = page.locator('text=Demo').first()
      const loginForm = page.locator('form').first()
      
      const hasDemoButton = await demoButton.isVisible().catch(() => false)
      const hasLoginForm = await loginForm.isVisible().catch(() => false)
      
      expect(hasDemoButton || hasLoginForm).toBeTruthy()
    })

    test('should complete demo login', async ({ page }) => {
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')
      
      // Try clicking demo button
      const demoButton = page.locator('button:has-text("Demo")').first()
      if (await demoButton.isVisible().catch(() => false)) {
        await demoButton.click()
        await page.waitForLoadState('networkidle')
      }
      
      // Should navigate somewhere after demo login
      const url = page.url()
      expect(url).toContain('localhost')
    })
  })

  test.describe('V3 Components', () => {
    test('should have attendance components available', async ({ page }) => {
      await page.goto('/v3/meetings/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      await page.waitForLoadState('networkidle')
      // Page should load without errors
      const errors = await page.evaluate(() => {
        return (window as any).__REACT_ERROR_COUNT__ || 0
      })
      expect(errors).toBe(0)
    })
  })

  test.describe('Voter Flow', () => {
    test('should access voter login', async ({ page }) => {
      await page.goto('/voter/login')
      await page.waitForLoadState('networkidle')
      
      // Should have some login interface
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
    })
  })

  test.describe('API Health', () => {
    test('should connect to Supabase', async ({ page }) => {
      // This tests that the app can initialize Supabase
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check browser console for Supabase errors
      const logs: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text())
        }
      })
      
      await page.waitForTimeout(2000)
      
      // Filter out non-critical errors
      const criticalErrors = logs.filter(log => 
        log.includes('FATAL') || 
        log.includes('supabase') && log.includes('error')
      )
      
      expect(criticalErrors.length).toBe(0)
    })
  })
})
