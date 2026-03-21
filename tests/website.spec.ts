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

    await page.route('https://calendly.com/assets/external/widget.css', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/css',
        body: '',
      });
    });

    await page.route('https://calendly.com/assets/external/widget.js', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.Calendly={initPopupWidget:()=>{},closePopupWidget:()=>{}};',
      });
    });
  });

  test('homepage loads and renders the redesigned landing surface', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /operate deployed agents like infrastructure\./i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /open live demo/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /run quickstart/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /read docs/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /github/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /book a demo/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toHaveCount(0);
  });

  test('landing page exposes proof rail and operator flow sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/^Broken deploys$/).first()).toBeVisible();
    await expect(page.getByText(/^Security stalls$/).first()).toBeVisible();
    await expect(page.getByText(/^Cost drift$/).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /the sale dies at production handoff\./i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /run the proof path\./i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /20-minute working session/i })
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /hosted operator/i })).toBeVisible();
    await expect(page.getByText(/curl -fsSL https:\/\/mutx\.dev\/install\.sh \| bash/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /book a demo/i })).toHaveCount(2);
    await expect(
      page.getByRole('heading', { name: /see it\. change it\. recover it\./i })
    ).toHaveCount(0);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    const ignoredErrorPatterns = [
      /favicon\.ico/i,
      /favicon/i,
      /Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)/i,
      /Image corrupt or truncated/i,
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

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (error) => !ignoredErrorPatterns.some((pattern) => pattern.test(error))
    );

    expect(criticalErrors, 'Console errors: ' + criticalErrors.join('; ')).toHaveLength(0);
  });
});
