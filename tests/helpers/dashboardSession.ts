import type { Page } from '@playwright/test';

/** Mock the real dashboard boundary while keeping route-specific API failures separate. */
export async function mockDashboardSession(page: Page) {
  await page.route('**/api/dashboard/access', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: true,
        user: { id: 'operator_alpha', email: 'operator@mutx.dev', name: 'Operator', roles: ['DEVELOPER'] },
      }),
    });
  });
}
