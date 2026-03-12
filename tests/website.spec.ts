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
    // Go to homepage (using baseURL from config)
    await page.goto('/');

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');

    // Check h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });

    // Check waitlist form exists
    const emailInput = page.locator('input[type=\"email\"]').first();
    await expect(emailInput).toBeVisible();

    const waitlistForm = page.getByTestId('waitlist-form-hero');
    await expect(waitlistForm).toBeVisible();

    const submitBtn = waitlistForm.locator('button[type=\"submit\"]');
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

    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log('HTTP_ERROR', response.status(), response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const isBenignError = (error: string) =>
      /favicon\\.ico/i.test(error) || /favicon/i.test(error);
    const criticalErrors = errors.filter((error) => !isBenignError(error));

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
  });
});
