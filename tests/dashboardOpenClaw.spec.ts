import { expect, test } from '@playwright/test'

async function mockOverviewTraffic(page: import('@playwright/test').Page) {
  await page.route('https://challenges.cloudflare.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts?.callback?.("ci-test-token"),0);return "widget-id";},reset:()=>{},remove:()=>{}};',
    })
  })

  await page.route('**/_next/image**', async (route) => {
    await route.fallback()
  })

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url

    if (pathname === '/api/dashboard/overview') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: '2025-03-21T08:15:00Z',
          session: {
            id: 'user_alpha',
            email: 'operator@mutx.dev',
            name: 'Operator',
            plan: 'operator',
          },
          resources: {
            agents: {
              status: 'ok',
              statusCode: 200,
              data: [{ id: 'agent_alpha', name: 'alpha-agent', status: 'running' }],
              error: null,
            },
            deployments: {
              status: 'ok',
              statusCode: 200,
              data: [
                { id: 'deploy_alpha', agent_id: 'agent_alpha', status: 'healthy', replicas: 1 },
              ],
              error: null,
            },
            runs: {
              status: 'ok',
              statusCode: 200,
              data: { items: [] },
              error: null,
            },
            alerts: {
              status: 'ok',
              statusCode: 200,
              data: { items: [] },
              error: null,
            },
            webhooks: {
              status: 'ok',
              statusCode: 200,
              data: { webhooks: [] },
              error: null,
            },
            budget: {
              status: 'ok',
              statusCode: 200,
              data: {
                plan: 'operator',
                credits_remaining: 3580,
                usage_percentage: 28,
              },
              error: null,
            },
            health: {
              status: 'ok',
              statusCode: 200,
              data: {
                status: 'healthy',
                timestamp: '2025-03-21T08:15:00Z',
              },
              error: null,
            },
            runtime: {
              status: 'ok',
              statusCode: 200,
              data: {
                label: 'OpenClaw',
                status: 'healthy',
                gateway_url: 'http://127.0.0.1:18789',
                binary_path: '/opt/homebrew/bin/openclaw',
                privacy_summary:
                  'MUTX tracks your local OpenClaw runtime without uploading local gateway keys or secrets.',
                last_seen_at: '2025-03-21T08:14:00Z',
                last_synced_at: '2025-03-21T08:15:00Z',
                binding_count: 1,
                stale: false,
                keys_remain_local: true,
                current_binding: {
                  assistant_id: 'personal-assistant',
                  assistant_name: 'Personal Assistant',
                  workspace: '/Users/fortune/.openclaw/workspace-personal-assistant',
                  model: 'openai/gpt-5',
                },
                bindings: [
                  {
                    assistant_id: 'personal-assistant',
                    assistant_name: 'Personal Assistant',
                    workspace: '/Users/fortune/.openclaw/workspace-personal-assistant',
                    model: 'openai/gpt-5',
                  },
                ],
              },
              error: null,
            },
            onboarding: {
              status: 'ok',
              statusCode: 200,
              data: {
                status: 'completed',
                current_step: 'verify',
                assistant_id: 'personal-assistant',
                assistant_name: 'Personal Assistant',
                workspace: '/Users/fortune/.openclaw/workspace-personal-assistant',
                gateway_url: 'http://127.0.0.1:18789',
              },
              error: null,
            },
          },
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
}

test.describe('Dashboard OpenClaw overview', () => {
  test.beforeEach(async ({ page }) => {
    await mockOverviewTraffic(page)
  })

  test('shows the tracked OpenClaw instance on the dashboard overview', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /overview/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /openclaw runtime/i })).toBeVisible()
    await expect(page.getByText('Personal Assistant')).toBeVisible()
    await expect(
      page.getByText('/Users/fortune/.openclaw/workspace-personal-assistant', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText('http://127.0.0.1:18789', { exact: true })).toBeVisible()
    await expect(page.getByText(/1 tracked binding/i)).toBeVisible()
  })

  test('does not fall back to auth-required when an overview-only endpoint is forbidden', async ({ page }) => {
    await page.route('**/api/dashboard/overview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: '2025-03-21T08:15:00Z',
          session: {
            id: 'user_alpha',
            email: 'operator@mutx.dev',
            name: 'Operator',
            plan: 'operator',
          },
          resources: {
            agents: {
              status: 'ok',
              statusCode: 200,
              data: [{ id: 'agent_alpha', name: 'alpha-agent', status: 'running' }],
              error: null,
            },
            deployments: {
              status: 'ok',
              statusCode: 200,
              data: [],
              error: null,
            },
            runs: {
              status: 'ok',
              statusCode: 200,
              data: { items: [] },
              error: null,
            },
            alerts: {
              status: 'ok',
              statusCode: 200,
              data: { items: [] },
              error: null,
            },
            webhooks: {
              status: 'ok',
              statusCode: 200,
              data: { webhooks: [] },
              error: null,
            },
            budget: {
              status: 'ok',
              statusCode: 200,
              data: {
                plan: 'operator',
                credits_remaining: 3580,
                usage_percentage: 28,
              },
              error: null,
            },
            health: {
              status: 'ok',
              statusCode: 200,
              data: {
                status: 'healthy',
                timestamp: '2025-03-21T08:15:00Z',
              },
              error: null,
            },
            runtime: {
              status: 'auth_error',
              statusCode: 403,
              data: null,
              error: 'Forbidden',
            },
            onboarding: {
              status: 'ok',
              statusCode: 200,
              data: {
                status: 'completed',
                current_step: 'verify',
                assistant_id: 'personal-assistant',
                assistant_name: 'Personal Assistant',
                workspace: '/Users/fortune/.openclaw/workspace-personal-assistant',
                gateway_url: 'http://127.0.0.1:18789',
              },
              error: null,
            },
          },
        }),
      })
    })

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /overview/i }).first()).toBeVisible()
    await expect(page.getByText(/operator session required/i)).toHaveCount(0)
    await expect(page.getByText('Personal Assistant')).toBeVisible()
  })
})
