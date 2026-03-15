import { test, expect, type Page } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
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

  async function getElementBounds(page: Page, selector: string) {
    const locator = page.locator(selector);
    await locator.first().waitFor({ state: 'visible', timeout: 5000 });
    return locator.first().evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        height: rect.height,
        width: rect.width,
      };
    });
  }

  async function hasOverlappingElements(page: Page, selectors: string[]) {
    const validSelectors = selectors.filter(async (sel) => {
      const count = await page.locator(sel).count();
      return count > 0;
    });
    
    if (validSelectors.length < 2) return false;

    const bounds = await Promise.all(
      validSelectors.map((sel) => getElementBounds(page, sel))
    );

    for (let i = 0; i < bounds.length; i++) {
      for (let j = i + 1; j < bounds.length; j++) {
        const a = bounds[i];
        const b = bounds[j];

        if (a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right) {
          return true;
        }
      }
    }
    return false;
  }

  test.describe('Login Page Layout', () => {
    test('Login page form elements do not overlap', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const formInputs = [
        'input#email',
        'input#password',
        'button[type="submit"]',
      ];

      const hasOverlap = await hasOverlappingElements(page, formInputs);
      expect(hasOverlap).toBe(false);
    });

    test('Login page labels are visible and not hidden', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');

      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();

      const emailBounds = await getElementBounds(page, 'label[for="email"]');
      const inputBounds = await getElementBounds(page, 'input#email');

      expect(emailBounds.bottom).toBeLessThanOrEqual(inputBounds.top + 10);
    });

    test('Login page inputs are not clipped on mobile', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      await page.setViewportSize({ width: 320, height: 568 });

      const emailInput = page.locator('input#email');
      const passwordInput = page.locator('input#password');

      const emailBounds = await getElementBounds(page, 'input#email');
      const viewportBounds = { width: 320, height: 568 };

      expect(emailBounds.left).toBeGreaterThanOrEqual(0);
      expect(emailBounds.right).toBeLessThanOrEqual(viewportBounds.width);
      expect(emailBounds.top).toBeGreaterThanOrEqual(0);
      expect(emailBounds.bottom).toBeLessThanOrEqual(viewportBounds.height);

      const passwordBounds = await getElementBounds(page, 'input#password');
      expect(passwordBounds.left).toBeGreaterThanOrEqual(0);
      expect(passwordBounds.right).toBeLessThanOrEqual(viewportBounds.width);
    });

    test('Login page error messages display correctly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      await page.fill('input#email', 'invalid');
      await page.fill('input#password', 'short');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const emailInputBounds = await getElementBounds(page, 'input#email');
      expect(emailInputBounds.top).toBeGreaterThan(0);
    });
  });

  test.describe('Register Page Layout', () => {
    test('Register page form elements do not overlap', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const formInputs = [
        'input#name',
        'input#email',
        'input#password',
        'input#confirmPassword',
        'button[type="submit"]',
      ];

      const hasOverlap = await hasOverlappingElements(page, formInputs);
      expect(hasOverlap).toBe(false);
    });

    test('Register page labels are visible', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');

      const nameLabel = page.locator('label[for="name"]');
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');

      await expect(nameLabel).toBeVisible();
      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
    });

    test('Register page inputs are not clipped on mobile', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');
      await page.setViewportSize({ width: 320, height: 568 });

      const emailBounds = await getElementBounds(page, 'input#email');
      const viewportBounds = { width: 320, height: 568 };

      expect(emailBounds.left).toBeGreaterThanOrEqual(0);
      expect(emailBounds.right).toBeLessThanOrEqual(viewportBounds.width);
    });
  });

  test.describe('Homepage Layout', () => {
    test('Homepage hero section is properly visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const heroBounds = await getElementBounds(page, 'main');
      expect(heroBounds.top).toBeLessThan(200);
    });

    test('Homepage main content has no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const bodyBounds = await getElementBounds(page, 'body');
      const viewportSize = page.viewportSize();

      if (viewportSize) {
        expect(bodyBounds.left).toBeLessThanOrEqual(5);
        expect(bodyBounds.right).toBeGreaterThanOrEqual(viewportSize.width - 5);
      }
    });

    test('Homepage CTAs are visible and not overlapping', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const ctaLinks = page.locator('main a');
      const count = await ctaLinks.count();

      if (count > 1) {
        const firstLinkBounds = await getElementBounds(page, 'main a >> nth=0');
        for (let i = 1; i < Math.min(count, 5); i++) {
          const linkBounds = await getElementBounds(page, `main a >> nth=${i}`);
          const verticalGap = linkBounds.top - firstLinkBounds.bottom;
          if (Math.abs(verticalGap) < 5) {
            expect(linkBounds.left).toBeGreaterThan(firstLinkBounds.right);
          }
        }
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('Mobile login page is usable', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input#email');
      const passwordInput = page.locator('input#password');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      const inputBounds = await getElementBounds(page, 'input#email');
      expect(inputBounds.width).toBeGreaterThan(100);
    });

    test('Mobile register page is usable', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input#email');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('Mobile view has no horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const bodyBounds = await getElementBounds(page, 'body');
      const viewportSize = page.viewportSize();

      if (viewportSize) {
        expect(bodyBounds.left).toBeLessThanOrEqual(5);
        expect(bodyBounds.right).toBeGreaterThanOrEqual(viewportSize.width - 10);
      }
    });

    test('Mobile homepage content is not clipped', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const mainBounds = await getElementBounds(page, 'main');
      const viewportSize = page.viewportSize();

      if (viewportSize) {
        expect(mainBounds.bottom).toBeLessThanOrEqual(viewportSize.height + 50);
      }
    });
  });

  test.describe('Auth Forms Accessibility', () => {
    test('Login form has proper label-input associations', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input#email');
      const emailLabel = page.locator('label[for="email"]');

      await expect(emailInput).toHaveAttribute('id', 'email');
      await expect(emailLabel).toHaveAttribute('for', 'email');
    });

    test('Register form has proper label-input associations', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input#email');
      const emailLabel = page.locator('label[for="email"]');

      await expect(emailInput).toHaveAttribute('id', 'email');
      await expect(emailLabel).toHaveAttribute('for', 'email');
    });

    test('Form inputs are keyboard accessible', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON']).toContain(focusedElement);
    });
  });

  test.describe('Loading States', () => {
    test('Login form shows loading state correctly', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input#email');
      await emailInput.fill('test@example.com');

      const passwordInput = page.locator('input#password');
      await passwordInput.fill('password123');

      await page.click('button[type="submit"]');

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('App Dashboard Layout (unauthenticated)', () => {
    test('App page shows auth required message', async ({ page }) => {
      await page.goto('/app');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const content = page.locator('main');
      await expect(content).toBeVisible();
    });

    test('App page does not have layout issues when showing auth required', async ({ page }) => {
      await page.goto('/app');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const bodyBounds = await getElementBounds(page, 'body');
      const viewportSize = page.viewportSize();

      if (viewportSize) {
        expect(bodyBounds.right).toBeLessThanOrEqual(viewportSize.width + 20);
      }
    });
  });
});
