import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Cloudflare Turnstile
    await page.route('https://challenges.cloudflare.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts?.callback?.("ci-test-token"),0);return "widget-id";},reset:()=>{},remove:()=>{}};',
      });
    });

    // Mock images
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

  test('login page loads and renders all form elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Check heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // Check form fields
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Check link to register
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();
  });

  test('login form shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Mock the login API to return an error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid email or password' }),
      });
    });

    // Fill in the form
    await page.getByLabel(/email address/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('login form validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Try to submit without filling fields
    const submitButton = page.getByRole('button', { name: /sign in/i });
    
    // The button should be enabled (HTML5 validation will handle required)
    await expect(submitButton).toBeEnabled();
    
    // Submit empty form - should trigger HTML5 validation
    await submitButton.click();
    
    // Check that email field shows validation error (required)
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('login form shows loading state during submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Mock the login API with a delay
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800
        }),
      });
    });

    // Fill in the form
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check loading state shows
    await expect(page.getByText(/signing in/i)).toBeVisible();
    
    // Button should be disabled during loading
    await expect(page.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Mock the login API to return success
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 1800
        }),
      });
    });

    // Fill in the form
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login page has working link to register page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Click the register link
    await page.getByRole('link', { name: /create one/i }).click();

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });
});
