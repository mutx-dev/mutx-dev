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

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('404'));

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
  });
});
