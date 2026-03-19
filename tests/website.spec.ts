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
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nWsAAAAASUVORK5CYII=',
            'base64'
          ),
        });
        return;
      }

      await route.fallback();
    });
  });

  test('homepage loads and renders landing operator surface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/open-source agent control plane/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /read docs/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /inspect repo/i })).toBeVisible();
  });

  test('landing page exposes live demo path and hero waitlist capture', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: /view demo path/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open operator app/i })).toBeVisible();
    await expect(page.getByText(/demo walkthrough/i)).toBeVisible();
    await expect(page.getByText(/demo checkpoints/i)).toBeVisible();
    await expect(page.getByTestId('waitlist-form-hero')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveCount(1);
  });

  test('legacy /app redirects into the canonical dashboard surface', async ({ page }) => {
    await page.goto('/app?next=%2Fdashboard%2Fagents&source=legacy');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/dashboard\?next=%2Fdashboard%2Fagents&source=legacy$/);
    await expect(page.getByRole('heading', { name: /deploy agents like services\. operate them like systems\./i })).toBeVisible();
    await expect(page.getByText(/mutx control plane/i)).toBeVisible();
    await expect(page.getByText(/canonical \/dashboard surface/i)).toBeVisible();
    await expect(page.getByText(/checking for an existing operator session/i)).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    const ignoredErrorPatterns = [
      /favicon\.ico/i,
      /favicon/i,
      /Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)/i,
    ];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('/api/turnstile/site-key')) {
        console.log('HTTP_ERROR', response.status(), response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (error) => !ignoredErrorPatterns.some((pattern) => pattern.test(error))
    );

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
  });
});
