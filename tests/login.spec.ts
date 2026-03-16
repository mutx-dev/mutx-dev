import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
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

  test('login page renders all expected UI elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();

    await expect(page.getByRole('link', { name: /mutx/i })).toBeVisible();
  });

  test('successful login redirects to /dashboard', async ({ page }) => {
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800,
        }),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('operator@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('invalid credentials shows error message', async ({ page }) => {
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test('generic server error shows fallback error message', async ({ page }) => {
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('user@example.com');
    await page.locator('#password').fill('somepassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/login failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows loading state while submitting', async ({ page }) => {
    await page.route('/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800,
        }),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('operator@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  test('"Create one" link navigates to the register page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /create one/i }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('register page "Sign in" link navigates back to login', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
