import { test, expect } from '@playwright/test';

test.describe('mutx.dev QA', () => {
  test('homepage loads and renders waitlist signup', async ({ page }) => {
    // Go to homepage (using baseURL from config)
    await page.goto('/');
    
    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    
    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });
    
    // Check waitlist form exists
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    const waitlistForm = page.getByTestId('waitlist-form-hero');
    await expect(waitlistForm).toBeVisible();

    const submitBtn = waitlistForm.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter((e) => {
      const lower = e.toLowerCase();
      const isNonActionable =
        lower.includes('favicon') ||
        lower.includes('404') ||
        lower.includes('font-size:0;color:transparent') ||
        lower.includes("script-src' was not explicitly set") ||
        (lower.includes('failed to load resource') && lower.includes('401'));

      return !isNonActionable;
    });

    expect(
      criticalErrors,
      `Console errors: ${criticalErrors.join('\n')}`,
    ).toHaveLength(0);
  });
});
