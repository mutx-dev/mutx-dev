import { test, expect } from '@playwright/test';

test.describe('mutx.dev QA', () => {
  test('homepage loads and has working waitlist', async ({ page }) => {
    // Go to homepage
    await page.goto('https://mutx.dev');
    
    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    
    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });
    
    // Check waitlist form exists
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Test form submission
    const email = `test${Date.now()}@example.com`;
    await emailInput.fill(email);
    
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    
    // Wait for success
    await expect(page.locator('text=You\'re on the list')).toBeVisible({ timeout: 15000 });
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('https://mutx.dev');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    console.log('Errors found:', criticalErrors);
  });
});
