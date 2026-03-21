import { expect, test, type Page } from '@playwright/test';

const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nWsAAAAASUVORK5CYII=',
  'base64'
);

const mockedAgents = [
  {
    id: 'agent_alpha',
    name: 'alpha-agent',
    status: 'running',
    description: 'Primary smoke-test agent',
    created_at: '2025-03-21T08:00:00Z',
    updated_at: '2025-03-21T08:05:00Z',
  },
  {
    id: 'agent_beta',
    name: 'beta-agent',
    status: 'healthy',
    description: 'Secondary smoke-test agent',
    created_at: '2025-03-20T08:00:00Z',
    updated_at: '2025-03-21T07:45:00Z',
  },
];

const mockedDeployments = [
  {
    id: 'deploy_alpha',
    agent_id: 'agent_alpha',
    status: 'running',
    replicas: 2,
    started_at: '2025-03-21T07:00:00Z',
    ended_at: '2025-03-21T07:45:00Z',
  },
  {
    id: 'deploy_beta',
    agent_id: 'agent_beta',
    status: 'healthy',
    replicas: 1,
    started_at: '2025-03-21T06:15:00Z',
    ended_at: '2025-03-21T07:10:00Z',
  },
];

const mockedRuns = [
  {
    id: 'run_alpha',
    agent_id: 'agent_alpha',
    status: 'completed',
    input_text: 'Promote latest deployment',
    output_text: 'Promotion completed without dropped traces.',
    error_message: null,
    metadata: {},
    started_at: '2025-03-21T07:50:00Z',
    completed_at: '2025-03-21T07:54:00Z',
    created_at: '2025-03-21T07:49:00Z',
    trace_count: 4,
  },
  {
    id: 'run_beta',
    agent_id: 'agent_beta',
    status: 'running',
    input_text: 'Inspect staging rollout',
    output_text: null,
    error_message: null,
    metadata: {},
    started_at: '2025-03-21T08:05:00Z',
    completed_at: null,
    created_at: '2025-03-21T08:04:00Z',
    trace_count: 3,
  },
];

const mockedRunTraces = [
  {
    id: 'trace_alpha_1',
    run_id: 'run_alpha',
    event_type: 'request.received',
    message: 'Ingress accepted by governed operator surface.',
    payload: {},
    sequence: 1,
    timestamp: '2025-03-21T07:50:01Z',
  },
  {
    id: 'trace_alpha_2',
    run_id: 'run_alpha',
    event_type: 'deployment.promoted',
    message: 'Production deployment promoted with receipts.',
    payload: {},
    sequence: 2,
    timestamp: '2025-03-21T07:53:00Z',
  },
];

const mockedAlerts = [
  {
    id: 'alert_alpha',
    agent_id: 'agent_alpha',
    type: 'deployment_failed',
    message: 'Staging rollback was requested after a transient health dip.',
    resolved: false,
    created_at: '2025-03-21T08:12:00Z',
    resolved_at: null,
  },
  {
    id: 'alert_beta',
    agent_id: 'agent_beta',
    type: 'cpu_high',
    message: 'Background run pressure breached the soft queue watermark.',
    resolved: true,
    created_at: '2025-03-21T07:40:00Z',
    resolved_at: '2025-03-21T07:44:00Z',
  },
];

const mockedBudget = {
  user_id: '11111111-1111-1111-1111-111111111111',
  plan: 'operator',
  credits_total: 5000,
  credits_used: 1420,
  credits_remaining: 3580,
  reset_date: '2025-04-01T00:00:00Z',
  usage_percentage: 28,
};

const mockedUsageBreakdown = {
  total_credits_used: 1420,
  credits_remaining: 3580,
  credits_total: 5000,
  period_start: '2025-03-01T00:00:00Z',
  period_end: '2025-03-31T23:59:59Z',
  usage_by_agent: [
    { agent_id: 'agent_alpha', agent_name: 'alpha-agent', credits_used: 840, event_count: 28 },
    { agent_id: 'agent_beta', agent_name: 'beta-agent', credits_used: 580, event_count: 18 },
  ],
  usage_by_type: [
    { event_type: 'run.completed', credits_used: 900, event_count: 24 },
    { event_type: 'webhook.replay', credits_used: 520, event_count: 22 },
  ],
};

const mockedAnalyticsSummary = {
  total_agents: 2,
  active_agents: 2,
  total_deployments: 2,
  active_deployments: 2,
  total_runs: 11,
  successful_runs: 9,
  failed_runs: 2,
  total_api_calls: 324,
  avg_latency_ms: 184,
  period_start: '2025-03-01T00:00:00Z',
  period_end: '2025-03-31T23:59:59Z',
};

const mockedUsageEvents = [
  {
    id: 'usage_alpha',
    event_type: 'run.completed',
    user_id: '11111111-1111-1111-1111-111111111111',
    resource_id: 'run_alpha',
    event_metadata: '{"credits_used":45}',
    created_at: '2025-03-21T08:01:00Z',
    metadata: {},
  },
  {
    id: 'usage_beta',
    event_type: 'webhook.replay',
    user_id: '11111111-1111-1111-1111-111111111111',
    resource_id: 'wh_alpha',
    event_metadata: '{"credits_used":12}',
    created_at: '2025-03-21T08:09:00Z',
    metadata: {},
  },
];

const mockedSwarms = [
  {
    id: 'swarm_alpha',
    name: 'Revenue Swarm',
    description: 'Grouped promotion lane for revenue-facing agents',
    agent_ids: ['agent_alpha', 'agent_beta'],
    min_replicas: 1,
    max_replicas: 4,
    created_at: '2025-03-18T09:00:00Z',
    updated_at: '2025-03-21T08:08:00Z',
    agents: [
      { agent_id: 'agent_alpha', agent_name: 'alpha-agent', status: 'running', replicas: 2 },
      { agent_id: 'agent_beta', agent_name: 'beta-agent', status: 'healthy', replicas: 1 },
    ],
  },
];

const mockedWebhooks = [
  {
    id: 'wh_alpha',
    url: 'https://hooks.example.com/mutx/alpha',
    events: ['agent.started', 'deployment.completed'],
    is_active: true,
    created_at: '2025-03-20T10:00:00Z',
  },
  {
    id: 'wh_beta',
    url: 'https://hooks.example.com/mutx/beta',
    events: ['run.failed'],
    is_active: false,
    created_at: '2025-03-19T12:00:00Z',
  },
];

const mockedWebhookDeliveries = [
  {
    id: 'whd_alpha',
    event: 'agent.started',
    payload: '{"agent_id":"agent_alpha"}',
    status_code: 200,
    success: true,
    error_message: null,
    attempts: 1,
    created_at: '2025-03-21T08:10:00Z',
    delivered_at: '2025-03-21T08:10:02Z',
  },
  {
    id: 'whd_beta',
    event: 'run.failed',
    payload: '{"run_id":"run_beta"}',
    status_code: 502,
    success: false,
    error_message: 'Upstream timeout',
    attempts: 3,
    created_at: '2025-03-21T08:12:00Z',
    delivered_at: null,
  },
];

const mockedApiKeys = [
  {
    id: 'key_alpha',
    name: 'alpha key',
    created_at: '2025-03-18T09:00:00Z',
    last_used: '2025-03-21T08:00:00Z',
    expires_at: null,
  },
  {
    id: 'key_beta',
    name: 'beta key',
    created_at: '2025-03-17T09:00:00Z',
    last_used: null,
    expires_at: '2025-04-17T09:00:00Z',
  },
];

type RouteSpec = {
  path: string;
  heading: RegExp;
  primaryText: RegExp;
  afterLoad?: (page: Page) => Promise<void>;
};

const controlRoutes: RouteSpec[] = [
  {
    path: '/control',
    heading: /environment matrix/i,
    primaryText: /active deployments/i,
  },
  {
    path: '/control/agents',
    heading: /agent registry/i,
    primaryText: /command queue/i,
  },
  {
    path: '/control/deployments',
    heading: /active deployments/i,
    primaryText: /rollout lane/i,
  },
  {
    path: '/control/runs',
    heading: /queue pressure/i,
    primaryText: /active run board/i,
  },
  {
    path: '/control/environments',
    heading: /environment matrix/i,
    primaryText: /readiness signals/i,
  },
  {
    path: '/control/access',
    heading: /credential registry/i,
    primaryText: /auth anomalies/i,
  },
  {
    path: '/control/connectors',
    heading: /connector grid/i,
    primaryText: /delivery exceptions/i,
  },
  {
    path: '/control/audit',
    heading: /audit timeline/i,
    primaryText: /ownership changes/i,
  },
  {
    path: '/control/usage',
    heading: /spend split/i,
    primaryText: /budget posture/i,
  },
  {
    path: '/control/settings',
    heading: /policy packs/i,
    primaryText: /runtime contracts/i,
  },
];

const dashboardRoutes: RouteSpec[] = [
  {
    path: '/dashboard',
    heading: /overview/i,
    primaryText: /operator posture/i,
  },
  {
    path: '/dashboard/agents',
    heading: /agents/i,
    primaryText: /create agent/i,
  },
  {
    path: '/dashboard/deployments',
    heading: /deployments/i,
    primaryText: /deployment timeline and recovery controls/i,
  },
  {
    path: '/dashboard/runs',
    heading: /runs/i,
    primaryText: /execution timeline/i,
  },
  {
    path: '/dashboard/traces',
    heading: /traces/i,
    primaryText: /trace stream/i,
  },
  {
    path: '/dashboard/monitoring',
    heading: /monitoring/i,
    primaryText: /alert rail/i,
  },
  {
    path: '/dashboard/budgets',
    heading: /budgets/i,
    primaryText: /usage by agent/i,
  },
  {
    path: '/dashboard/webhooks',
    heading: /webhooks/i,
    primaryText: /add webhook/i,
  },
  {
    path: '/dashboard/api-keys',
    heading: /security/i,
    primaryText: /alpha key/i,
    afterLoad: async (page) => {
      await expect(page).toHaveURL(/\/dashboard\/security(?:\/|$)/);
    },
  },
  {
    path: '/dashboard/memory',
    heading: /memory/i,
    primaryText: /memory status/i,
  },
  {
    path: '/dashboard/orchestration',
    heading: /orchestration/i,
    primaryText: /orchestration status/i,
  },
  {
    path: '/dashboard/swarm',
    heading: /swarm/i,
    primaryText: /swarm topology/i,
  },
];

async function mockMatrixTraffic(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body:
        'window.turnstile={render:(el,opts)=>{setTimeout(()=>opts?.callback?.("ci-test-token"),0);return "widget-id";},reset:()=>{},remove:()=>{}};',
    });
  });

  await page.route('**/_next/image**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: ONE_BY_ONE_PNG,
    });
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    if (pathname === '/api/dashboard/agents' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedAgents),
      });
      return;
    }

    if (pathname.startsWith('/api/dashboard/agents/') && method === 'GET') {
      const agentId = decodeURIComponent(pathname.split('/').pop() ?? 'agent_alpha');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: agentId,
          name: agentId.replace(/_/g, '-'),
          status: 'running',
          description: 'Route matrix detail payload',
          created_at: '2025-03-21T08:00:00Z',
          updated_at: '2025-03-21T08:05:00Z',
          config: { mode: 'matrix' },
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/deployments' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedDeployments),
      });
      return;
    }

    if (pathname === '/api/dashboard/runs' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockedRuns,
          total: mockedRuns.length,
          skip: 0,
          limit: Number(searchParams.get('limit') || 24),
          status: null,
          agent_id: null,
        }),
      });
      return;
    }

    if (pathname.startsWith('/api/dashboard/runs/') && pathname.endsWith('/traces') && method === 'GET') {
      const runId = pathname.split('/')[4] ?? 'run_alpha';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          run_id: runId,
          items: mockedRunTraces.map((trace) => ({ ...trace, run_id: runId })),
          total: mockedRunTraces.length,
          skip: 0,
          limit: Number(searchParams.get('limit') || 64),
          event_type: null,
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/monitoring/alerts' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockedAlerts,
          total: mockedAlerts.length,
          unresolved_count: mockedAlerts.filter((alert) => !alert.resolved).length,
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/budgets' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedBudget),
      });
      return;
    }

    if (pathname === '/api/dashboard/budgets/usage' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedUsageBreakdown),
      });
      return;
    }

    if (pathname === '/api/dashboard/analytics/summary' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedAnalyticsSummary),
      });
      return;
    }

    if (pathname === '/api/dashboard/usage/events' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockedUsageEvents,
          total: mockedUsageEvents.length,
          skip: 0,
          limit: Number(searchParams.get('limit') || 12),
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/swarms' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockedSwarms,
          total: mockedSwarms.length,
          skip: 0,
          limit: Number(searchParams.get('limit') || 16),
        }),
      });
      return;
    }

    if (pathname.startsWith('/api/dashboard/deployments/') && method === 'GET') {
      const deploymentId = decodeURIComponent(pathname.split('/').pop() ?? 'deploy_alpha');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: deploymentId,
          agent_id: 'agent_alpha',
          status: 'running',
          replicas: 2,
          started_at: '2025-03-21T07:00:00Z',
          ended_at: '2025-03-21T07:45:00Z',
        }),
      });
      return;
    }

    if (pathname === '/api/webhooks' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ webhooks: mockedWebhooks }),
      });
      return;
    }

    if (pathname.startsWith('/api/webhooks/') && pathname.endsWith('/deliveries') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deliveries: mockedWebhookDeliveries }),
      });
      return;
    }

    if (pathname === '/api/api-keys' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockedApiKeys.map((key) => ({
            ...key,
            status: 'active',
            last_used_at: key.last_used,
            scopes: ['operator'],
          })),
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/health' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          database: 'ok',
          timestamp: '2025-03-21T08:15:00Z',
          uptime: 98765,
          agents: mockedAgents.length,
          deployments: mockedDeployments.length,
        }),
      });
      return;
    }

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

async function assertNoOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });

  expect(
    metrics.scrollWidth,
    `expected no horizontal overflow, but scrollWidth=${metrics.scrollWidth} and clientWidth=${metrics.clientWidth}`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectVisibleRouteTitle(page: Page, heading: RegExp) {
  const headingByRole = page.getByRole('heading', { name: heading }).first();

  try {
    await expect(headingByRole).toBeVisible({ timeout: 5000 });
    return;
  } catch {
    // Some demo routes use styled text instead of semantic heading tags.
  }

  await expect(page.getByText(heading).first()).toBeVisible({ timeout: 5000 });
}

async function assertRouteSurface(page: Page, route: RouteSpec) {
  const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

  expect(response, `No response returned for ${route.path}`).not.toBeNull();
  expect(response?.status(), `${route.path} returned ${response?.status()}`).toBeLessThan(500);

  await expect(page.getByText(/Internal Server Error/i)).toHaveCount(0);
  await expectVisibleRouteTitle(page, route.heading);
  await expect(page.getByText(route.primaryText).first()).toBeVisible({ timeout: 10000 });
  await assertNoOverflow(page);

  if (route.afterLoad) {
    await route.afterLoad(page);
  }
}

async function exerciseMobileSidebar(page: Page, heading: RegExp) {
  const openSidebar = page.getByRole('button', { name: /open dashboard sidebar/i });

  if (!(await openSidebar.count())) {
    return;
  }

  if (!(await openSidebar.first().isVisible().catch(() => false))) {
    return;
  }

  await openSidebar.first().click();

  const closeSidebar = page.getByRole('button', { name: /close dashboard sidebar/i });
  await expect(closeSidebar.first()).toBeVisible({ timeout: 5000 });

  await closeSidebar.first().click();
  await expectVisibleRouteTitle(page, heading);
  await assertNoOverflow(page);
}

test.describe('Dashboard route matrix', () => {
  test.describe('desktop', () => {
    test.beforeEach(async ({ page }) => {
      await mockMatrixTraffic(page);
    });

    for (const route of controlRoutes) {
      test(`control route renders: ${route.path}`, async ({ page }) => {
        await assertRouteSurface(page, route);
      });
    }

    for (const route of dashboardRoutes) {
      test(`dashboard route renders: ${route.path}`, async ({ page }) => {
        await assertRouteSurface(page, route);
      });
    }
  });

  test.describe('mobile', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    test.beforeEach(async ({ page }) => {
      await mockMatrixTraffic(page);
    });

    for (const route of controlRoutes) {
      test(`control route renders on mobile: ${route.path}`, async ({ page }) => {
        await assertRouteSurface(page, route);
      });
    }

    for (const route of dashboardRoutes) {
      test(`dashboard route renders on mobile: ${route.path}`, async ({ page }) => {
        await assertRouteSurface(page, route);
        await exerciseMobileSidebar(page, route.heading);
      });
    }
  });
});
