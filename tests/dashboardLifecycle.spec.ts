import { expect, test } from '@playwright/test';
import { mockDashboardSession } from './helpers/dashboardSession';

for (const viewport of [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'mobile', width: 390, height: 844 },
]) {
  test(`termination stays pending and cannot be replaced by Stop (${viewport.label})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockDashboardSession(page);
    let terminationRequested = false;
    const writes: string[] = [];
    const deployment = {
      id: '33333333-3333-4333-a333-333333333333',
      agent_id: '22222222-2222-4222-a222-222222222222',
      replicas: 1,
      started_at: '2026-09-29T12:00:00Z',
      ended_at: null,
      status: 'running',
      desired_action: 'deploy',
      desired_state: 'running',
      target_revision: 1,
      observed_state: 'running',
      observed_revision: 1,
      observed_at: '2026-09-29T12:00:00Z',
      allowed_actions: ['stop', 'restart', 'scale', 'terminate'],
      can_stop: true,
      can_restart: true,
      can_terminate: true,
    };
    await page.route('**/api/dashboard/agents**', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/dashboard/deployments**', async (route) => {
      const request = route.request();
      if (request.method() !== 'GET') {
        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        expect(request.method()).toBe('DELETE');
        terminationRequested = true;
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fulfill({ json: [{ ...deployment, ...(terminationRequested ? {
        status: 'pending', desired_action: 'terminate', desired_state: 'terminated',
        target_revision: 2, allowed_actions: [],
        can_stop: false, can_restart: false, can_terminate: false,
      } : {}) }] });
    });
    await page.goto('/dashboard/deployments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Terminate', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: 'Terminate', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Terminate Deployment', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Termination requested for deployment' })).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('pending', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Restart', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Terminate', exact: true })).toHaveCount(0);
    expect(writes).toEqual([`DELETE /api/dashboard/deployments/${deployment.id}`]);
  });
}
