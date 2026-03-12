import { test, expect } from '@playwright/test';

test.describe('mutx.dev QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://challenges.cloudflare.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts?.callback?.("ci-test-token"),0);return "widget-id";},reset:()=>{},remove:()=>{}};',
      });
    });

    await page.route('**/_next/image**', async (route) => {
      const url = new URL(route.request().url());
      const originalUrl = url.searchParams.get('url');

      if (!originalUrl || originalUrl.includes('/logo.png')) {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nWsAAAAASUVORK5CYII=', 'base64'),
        });
        return;
      }

      await route.fallback();
    });
  });

  test('homepage loads and renders waitlist signup', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });

    const waitlistForm = page.getByTestId('waitlist-form-hero');
    await expect(waitlistForm).toBeVisible();

    const emailInput = waitlistForm.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    await expect(waitlistForm.getByText(/loading verification challenge/i)).toBeHidden();

    const submitBtn = waitlistForm.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('waitlist verification failure is surfaced to the user', async ({ page }) => {
    await page.route('**/api/turnstile/site-key', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ siteKey: '' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const waitlistForm = page.getByTestId('waitlist-form-hero');
    await expect(waitlistForm).toBeVisible();
    await expect(waitlistForm.getByText(/loading verification challenge/i)).toBeHidden();
    await expect(waitlistForm.getByText(/waitlist verification is unavailable right now/i)).toBeVisible();

    const submitBtn = waitlistForm.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
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

    const isBenignError = (error: string) =>
      /favicon\.ico/i.test(error) ||
      /favicon/i.test(error) ||
      /503 \(Service Unavailable\)/i.test(error);
    const criticalErrors = errors.filter((error) => !isBenignError(error));

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
  });
});
