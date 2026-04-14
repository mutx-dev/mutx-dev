#!/usr/bin/env node

import assert from "node:assert/strict";
import process from "node:process";

import { chromium } from "playwright";

const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = baseUrlArg ? baseUrlArg.slice("--base-url=".length) : "http://127.0.0.1:3001";
const baseOrigin = new URL(baseUrl).origin;
const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8nWsAAAAASUVORK5CYII=",
  "base64",
);
const NOW = "2026-04-14T10:15:00Z";

const mockedAgents = [
  {
    id: "agent_alpha",
    name: "alpha-agent",
    status: "running",
    description: "Primary smoke-test agent",
    created_at: "2026-04-14T09:45:00Z",
    updated_at: "2026-04-14T10:05:00Z",
    type: "openai",
    config: { mode: "managed" },
  },
  {
    id: "agent_beta",
    name: "beta-agent",
    status: "healthy",
    description: "Secondary smoke-test agent",
    created_at: "2026-04-14T09:00:00Z",
    updated_at: "2026-04-14T09:55:00Z",
    type: "openai",
    config: { mode: "assisted" },
  },
];

const mockedDeployments = [
  {
    id: "deploy_alpha",
    agent_id: "agent_alpha",
    status: "running",
    replicas: 2,
    started_at: "2026-04-14T09:00:00Z",
    ended_at: null,
  },
  {
    id: "deploy_beta",
    agent_id: "agent_beta",
    status: "healthy",
    replicas: 1,
    started_at: "2026-04-14T08:20:00Z",
    ended_at: null,
  },
];

const mockedRuns = [
  {
    id: "run_alpha",
    agent_id: "agent_alpha",
    status: "completed",
    input_text: "Promote latest deployment",
    output_text: "Promotion completed without dropped traces.",
    error_message: null,
    metadata: {},
    started_at: "2026-04-14T09:50:00Z",
    completed_at: "2026-04-14T09:54:00Z",
    created_at: "2026-04-14T09:49:00Z",
    trace_count: 3,
    subject_label: "alpha rollout",
    execution_mode: "managed",
  },
  {
    id: "run_beta",
    agent_id: "agent_beta",
    status: "running",
    input_text: "Inspect staging rollout",
    output_text: null,
    error_message: null,
    metadata: {},
    started_at: "2026-04-14T10:05:00Z",
    completed_at: null,
    created_at: "2026-04-14T10:04:00Z",
    trace_count: 2,
    subject_label: "beta rollout",
    execution_mode: "assisted",
  },
];

const mockedObservabilityRuns = [
  {
    id: "obs_alpha",
    agent_id: "agent_alpha",
    agent_name: "alpha-agent",
    model: "openai/gpt-5.4",
    provider: "openai",
    runtime: "managed",
    status: "completed",
    outcome: "success",
    started_at: "2026-04-14T09:52:00Z",
    ended_at: "2026-04-14T09:53:10Z",
    duration_ms: 70123,
    tools_available: ["shell", "browser"],
    cost: { input_tokens: 800, output_tokens: 240, total_tokens: 1040, cost_usd: 0.021 },
    steps: [{ id: "step_alpha", type: "tool", tool_name: "shell", success: true, duration_ms: 4000, started_at: "2026-04-14T09:52:10Z" }],
    run_metadata: {},
  },
  {
    id: "obs_beta",
    agent_id: "agent_beta",
    agent_name: "beta-agent",
    model: "anthropic/claude-sonnet",
    provider: "anthropic",
    runtime: "assisted",
    status: "running",
    outcome: "in_progress",
    started_at: "2026-04-14T10:07:00Z",
    ended_at: null,
    duration_ms: 18200,
    tools_available: ["browser"],
    cost: { input_tokens: 320, output_tokens: 90, total_tokens: 410, cost_usd: 0.008 },
    steps: [{ id: "step_beta", type: "tool", tool_name: "browser", success: true, duration_ms: 2100, started_at: "2026-04-14T10:07:05Z" }],
    run_metadata: {},
  },
];

const mockedTracesByRun = {
  run_alpha: [
    {
      id: "trace_alpha_1",
      run_id: "run_alpha",
      event_type: "request.received",
      message: "Ingress accepted by governed operator surface.",
      payload: {},
      sequence: 1,
      timestamp: "2026-04-14T09:50:01Z",
    },
    {
      id: "trace_alpha_2",
      run_id: "run_alpha",
      event_type: "deployment.promoted",
      message: "Production deployment promoted with receipts.",
      payload: {},
      sequence: 2,
      timestamp: "2026-04-14T09:53:00Z",
    },
  ],
  run_beta: [
    {
      id: "trace_beta_1",
      run_id: "run_beta",
      event_type: "deployment.blocked",
      message: "Rollout paused while the operator checks staging.",
      payload: {},
      sequence: 1,
      timestamp: "2026-04-14T10:05:10Z",
    },
    {
      id: "trace_beta_2",
      run_id: "run_beta",
      event_type: "approval.requested",
      message: "Waiting on operator confirmation before proceeding.",
      payload: {},
      sequence: 2,
      timestamp: "2026-04-14T10:05:40Z",
    },
  ],
};

const mockedAlerts = [
  {
    id: "alert_alpha",
    agent_id: "agent_alpha",
    type: "deployment_failed",
    message: "Staging rollback was requested after a transient health dip.",
    resolved: false,
    created_at: "2026-04-14T10:12:00Z",
    resolved_at: null,
  },
];

const mockedBudget = {
  user_id: "11111111-1111-1111-1111-111111111111",
  plan: "operator",
  credits_total: 5000,
  credits_used: 1420,
  credits_remaining: 3580,
  reset_date: "2026-05-01T00:00:00Z",
  usage_percentage: 28,
};

const mockedUsageBreakdown = {
  total_credits_used: 1420,
  credits_remaining: 3580,
  credits_total: 5000,
  period_start: "2026-04-01T00:00:00Z",
  period_end: "2026-04-30T23:59:59Z",
  usage_by_agent: [
    { agent_id: "agent_alpha", agent_name: "alpha-agent", credits_used: 840, event_count: 28 },
    { agent_id: "agent_beta", agent_name: "beta-agent", credits_used: 580, event_count: 18 },
  ],
  usage_by_type: [
    { event_type: "run.completed", credits_used: 900, event_count: 24 },
    { event_type: "webhook.replay", credits_used: 520, event_count: 22 },
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
  period_start: "2026-04-01T00:00:00Z",
  period_end: "2026-04-30T23:59:59Z",
};

const mockedUsageEvents = [
  {
    id: "usage_alpha",
    event_type: "run.completed",
    user_id: "11111111-1111-1111-1111-111111111111",
    resource_id: "run_alpha",
    event_metadata: "{\"credits_used\":45}",
    created_at: "2026-04-14T10:01:00Z",
    metadata: {},
  },
];

const mockedWebhooks = [
  {
    id: "wh_alpha",
    url: "https://hooks.example.com/mutx/alpha",
    events: ["agent.started", "deployment.completed"],
    is_active: true,
    created_at: "2026-04-14T09:30:00Z",
  },
  {
    id: "wh_beta",
    url: "https://hooks.example.com/mutx/beta",
    events: ["run.failed"],
    is_active: false,
    created_at: "2026-04-14T09:10:00Z",
  },
];

const mockedWebhookDeliveries = [
  {
    id: "whd_alpha",
    event: "agent.started",
    payload: "{\"agent_id\":\"agent_alpha\"}",
    status_code: 200,
    success: true,
    error_message: null,
    attempts: 1,
    created_at: "2026-04-14T10:10:00Z",
    delivered_at: "2026-04-14T10:10:02Z",
  },
];

const mockedApiKeys = [
  {
    id: "key_alpha",
    name: "alpha key",
    status: "active",
    created_at: "2026-04-12T09:00:00Z",
    last_used_at: "2026-04-14T08:00:00Z",
    expires_at: null,
    scopes: ["operator"],
  },
  {
    id: "key_beta",
    name: "beta key",
    status: "active",
    created_at: "2026-04-11T09:00:00Z",
    last_used_at: null,
    expires_at: "2026-04-20T09:00:00Z",
    scopes: ["operator"],
  },
];

const mockedSessions = [
  {
    id: "session_alpha",
    key: "session_alpha",
    agent: "OpenClaw Operator",
    kind: "pairing",
    age: "18m",
    model: "openai/gpt-5.4",
    tokens: "12.4k",
    channel: "webchat",
    flags: ["web", "paired"],
    active: true,
    start_time: 1776167100,
    last_activity: 1776168200,
    source: "gateway",
  },
];

const mockedAssistantOverview = {
  assistant: {
    agent_id: "11111111-1111-1111-1111-111111111111",
    name: "OpenClaw Operator",
    status: "running",
    workspace: "operator-workspace",
    channels: [{ id: "webchat", label: "WebChat", enabled: true, mode: "pairing", allow_from: [] }],
    gateway: {
      status: "healthy",
      gateway_url: "http://127.0.0.1:18789",
    },
  },
};

const mockedOnboarding = {
  provider: "openclaw",
  status: "completed",
  action_type: "import_existing_runtime",
  current_step: "complete",
  completed_steps: ["detect", "bind", "complete"],
  assistant_name: "OpenClaw Operator",
  assistant_id: "openclaw-demo",
  workspace: "operator-workspace",
  gateway_url: "http://127.0.0.1:18789",
  updated_at: NOW,
  steps: [
    { id: "detect", title: "Detect OpenClaw runtime", completed: true },
    { id: "bind", title: "Bind assistant workspace", completed: true },
    { id: "complete", title: "Complete operator sync", completed: true },
  ],
  providers: [
    { id: "openclaw", label: "OpenClaw", summary: "Tracked assistant runtime", enabled: true, cue: "First" },
    { id: "codex", label: "Codex", summary: "Future provider surface", enabled: false, cue: "Next" },
  ],
};

const mockedRuntimeSnapshot = {
  provider: "openclaw",
  label: "OpenClaw",
  status: "healthy",
  install_method: "import_existing_runtime",
  binary_path: "/usr/local/bin/openclaw",
  gateway_url: "http://127.0.0.1:18789",
  version: "0.4.2",
  home_path: "/tmp/openclaw",
  tracking_mode: "import_existing_runtime",
  adopted_existing_runtime: true,
  privacy_summary: "Keys stay local and the dashboard reflects synced metadata only.",
  keys_remain_local: true,
  last_action_type: "import",
  config_path: "/tmp/openclaw/config.json",
  state_dir: "/tmp/openclaw/state",
  last_seen_at: NOW,
  last_synced_at: NOW,
  stale: false,
  binding_count: 1,
  bindings: [
    {
      assistant_id: "openclaw-demo",
      assistant_name: "OpenClaw Operator",
      workspace: "operator-workspace",
      model: "openai/gpt-5.4",
    },
  ],
};

const routeChecks = [
  { path: "/dashboard", text: "Recent execution" },
  { path: "/dashboard/agents", text: "Create Agent" },
  { path: "/dashboard/deployments", text: "Deployment registry" },
  { path: "/dashboard/runs", text: "Execution timeline" },
  { path: "/dashboard/traces", text: "Trace stream" },
  { path: "/dashboard/monitoring", text: "Alert rail" },
  { path: "/dashboard/observability", text: "Agent Runs" },
  { path: "/dashboard/analytics", text: "Trend lane" },
  { path: "/dashboard/sessions", text: "Session registry" },
  { path: "/dashboard/api-keys", text: "Key registry" },
  { path: "/dashboard/budgets", text: "Usage by agent" },
  { path: "/dashboard/webhooks", text: "Add Webhook" },
  { path: "/dashboard/security", text: "Credential inventory" },
  { path: "/dashboard/memory", text: "Memory surface" },
  { path: "/dashboard/orchestration", text: "Orchestration surface" },
  { path: "/dashboard/swarm", text: "Swarm topology" },
  { path: "/dashboard/control", text: "Provider Wizard" },
];

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(page) {
  await page.route("**/favicon.ico", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/_next/image**", async (route) => {
    await route.fulfill({ status: 200, contentType: "image/png", body: ONE_BY_ONE_PNG });
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (pathname === "/api/auth/me" && method === "GET") {
      return fulfillJson(route, { id: "11111111-1111-1111-1111-111111111111", email: "operator@example.com", name: "Operator" });
    }

    if (pathname === "/api/dashboard/overview" && method === "GET") {
      return fulfillJson(route, {
        generatedAt: NOW,
        session: { id: "user_alpha", email: "operator@mutx.dev", name: "Operator", plan: "operator" },
        resources: {
          agents: { status: "ok", statusCode: 200, data: { items: mockedAgents }, error: null },
          deployments: { status: "ok", statusCode: 200, data: { items: mockedDeployments }, error: null },
          runs: { status: "ok", statusCode: 200, data: { items: mockedRuns }, error: null },
          alerts: { status: "ok", statusCode: 200, data: { items: mockedAlerts }, error: null },
          webhooks: { status: "ok", statusCode: 200, data: { webhooks: mockedWebhooks }, error: null },
          budget: { status: "ok", statusCode: 200, data: mockedBudget, error: null },
          health: { status: "ok", statusCode: 200, data: { status: "ok", database: "ok", timestamp: NOW, uptime: 98765 }, error: null },
          runtime: { status: "ok", statusCode: 200, data: mockedRuntimeSnapshot, error: null },
          onboarding: { status: "ok", statusCode: 200, data: mockedOnboarding, error: null },
        },
      });
    }

    if (pathname === "/api/dashboard/agents" && method === "GET") return fulfillJson(route, mockedAgents);
    if (pathname === "/api/dashboard/deployments" && method === "GET") return fulfillJson(route, mockedDeployments);
    if (pathname === "/api/dashboard/runs" && method === "GET") return fulfillJson(route, { items: mockedRuns, total: mockedRuns.length, skip: 0, limit: 24 });
    if (pathname === "/api/dashboard/monitoring/alerts" && method === "GET") return fulfillJson(route, { items: mockedAlerts, total: mockedAlerts.length, unresolved_count: 1 });
    if (pathname === "/api/dashboard/budgets" && method === "GET") return fulfillJson(route, mockedBudget);
    if (pathname === "/api/dashboard/budgets/usage" && method === "GET") return fulfillJson(route, mockedUsageBreakdown);
    if (pathname === "/api/dashboard/analytics/summary" && method === "GET") return fulfillJson(route, mockedAnalyticsSummary);
    if (pathname === "/api/dashboard/analytics/timeseries" && method === "GET") {
      const metric = url.searchParams.get("metric");
      return fulfillJson(route, {
        metric: metric || "runs",
        interval: url.searchParams.get("interval") || "day",
        data: [
          { timestamp: "2026-04-12T00:00:00Z", value: metric === "latency" ? 164 : 4, label: "Apr 12" },
          { timestamp: "2026-04-13T00:00:00Z", value: metric === "latency" ? 188 : 6, label: "Apr 13" },
          { timestamp: "2026-04-14T00:00:00Z", value: metric === "latency" ? 184 : 5, label: "Apr 14" },
        ],
        period_start: "2026-04-01T00:00:00Z",
        period_end: "2026-04-30T23:59:59Z",
      });
    }
    if (pathname === "/api/dashboard/analytics/costs" && method === "GET") return fulfillJson(route, { total_credits_used: 1420, credits_remaining: 3580, credits_total: 5000, usage_by_event_type: { "run.completed": 900 }, usage_by_agent: { agent_alpha: 840 } });
    if (pathname === "/api/dashboard/usage/events" && method === "GET") return fulfillJson(route, { items: mockedUsageEvents, total: mockedUsageEvents.length, skip: 0, limit: 12 });
    if (pathname === "/api/dashboard/health" && method === "GET") return fulfillJson(route, { status: "ok", database: "ok", timestamp: NOW, uptime: 98765, agents: mockedAgents.length, deployments: mockedDeployments.length });
    if (pathname === "/api/dashboard/swarms" && method === "GET") return fulfillJson(route, { items: [{ id: "swarm_alpha", name: "Revenue Swarm", description: "Grouped promotion lane", agent_ids: ["agent_alpha", "agent_beta"], agents: [{ agent_id: "agent_alpha", agent_name: "alpha-agent", status: "running", replicas: 2 }] }], total: 1, skip: 0, limit: 16 });
    if (pathname === "/api/dashboard/sessions" && method === "GET") return fulfillJson(route, { sessions: mockedSessions });
    if (pathname === "/api/dashboard/assistant/overview" && method === "GET") return fulfillJson(route, mockedAssistantOverview);
    if (pathname === "/api/dashboard/observability" && method === "GET") {
      return fulfillJson(route, {
        items: mockedObservabilityRuns,
        total: mockedObservabilityRuns.length,
        skip: 0,
        limit: 50,
        telemetry: {
          config: { otel_enabled: true, exporter_type: "otlp", endpoint: "http://collector:4317" },
          health: { configured: true, endpoint_reachable: true, using_grpc: true, endpoint: "http://collector:4317" },
          errors: null,
        },
        sessionSummary: { total: 2, active: 1, channels: 2, sources: 1, latestActivityAt: NOW },
        sessionSummaryError: null,
      });
    }
    if (pathname === "/api/dashboard/onboarding" && method === "GET") return fulfillJson(route, mockedOnboarding);
    if (pathname === "/api/dashboard/runtime/providers/openclaw" && method === "GET") return fulfillJson(route, mockedRuntimeSnapshot);
    if (pathname === "/api/webhooks" && method === "GET") return fulfillJson(route, { webhooks: mockedWebhooks });
    if (pathname === "/api/api-keys" && method === "GET") return fulfillJson(route, { items: mockedApiKeys });

    if (pathname.startsWith("/api/dashboard/runs/") && pathname.endsWith("/traces") && method === "GET") {
      const runId = pathname.split("/")[4] ?? "run_alpha";
      const items = mockedTracesByRun[runId] ?? mockedTracesByRun.run_alpha;
      return fulfillJson(route, { run_id: runId, items, total: items.length, skip: 0, limit: 64 });
    }

    if (pathname.startsWith("/api/webhooks/") && pathname.endsWith("/deliveries") && method === "GET") {
      return fulfillJson(route, { deliveries: mockedWebhookDeliveries });
    }

    if (pathname === "/api/api-keys" && method === "POST") {
      return fulfillJson(route, { id: "key_new", name: "Smoke key", key: "mutx_live_secret_smoke", created_at: NOW });
    }

    if (pathname.startsWith("/api/api-keys/") && pathname.endsWith("/rotate") && method === "POST") {
      return fulfillJson(route, { id: "key_rotated", name: "Rotated key", key: "mutx_live_secret_rotated", created_at: NOW });
    }

    if (method === "GET") {
      return fulfillJson(route, {});
    }

    return fulfillJson(route, { ok: true });
  });
}

async function waitForBodyText(page, text) {
  await page.waitForFunction(
    (expected) => document.body?.innerText?.toLowerCase().includes(expected.toLowerCase()),
    text,
    { timeout: 15000 },
  );
}

async function visitRoute(page, path, text) {
  const response = await page.goto(`${baseUrl}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  assert(response, `No response returned for ${path}`);
  assert(response.status() < 500, `${path} returned ${response.status()}`);
  await waitForBodyText(page, text);
  const body = await page.locator("body").innerText();
  assert(!/Internal Server Error/i.test(body), `${path} rendered an internal server error`);
  assert(!/Application error/i.test(body), `${path} rendered an application error`);
}

async function dismissIntroIfPresent(page) {
  const enterDemo = page.getByRole("button", { name: /Enter demo now/i });
  if ((await enterDemo.count()) === 0) {
    return;
  }

  const visible = await enterDemo.first().isVisible().catch(() => false);
  if (!visible) {
    return;
  }

  await enterDemo.first().click();
  await page.waitForFunction(
    () => window.sessionStorage.getItem("mutx-app-demo-intro-played") === "1",
    { timeout: 5000 },
  );
}

async function exerciseShell(page) {
  await visitRoute(page, "/dashboard", "Recent execution");
  assert.equal(await page.getByRole("button", { name: "Home", exact: true }).count(), 0, "Home should not render on the home route");
  assert.equal(await page.getByRole("button", { name: "TUI", exact: true }).count(), 0, "Desktop-only TUI button should not render on the web shell");
  assert.equal(await page.getByRole("button", { name: "Reveal Workspace", exact: true }).count(), 0, "Desktop-only workspace button should not render on the web shell");

  await page.getByRole("button", { name: "Open Setup", exact: true }).click();
  await waitForBodyText(page, "Provider Wizard");
  assert.equal(new URL(page.url()).pathname, "/dashboard/control");

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await waitForBodyText(page, "Recent execution");
  assert.equal(new URL(page.url()).pathname, "/dashboard");
}

async function exerciseAgents(page) {
  await visitRoute(page, "/dashboard/agents", "Create Agent");
  await page.getByRole("button", { name: "Create Agent", exact: true }).click();
  await page.getByRole("heading", { name: "Create Agent", exact: true }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("heading", { name: "Create Agent", exact: true }).waitFor({ state: "hidden", timeout: 5000 });
  await page.getByRole("button", { name: "Copy ID", exact: true }).first().click();
  await waitForBodyText(page, "Copied");
}

async function exerciseDeployments(page) {
  await visitRoute(page, "/dashboard/deployments", "Deployment registry");
  await page.getByRole("button", { name: "New Deployment", exact: true }).click();
  await page.getByRole("heading", { name: "Create Deployment", exact: true }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("heading", { name: "Create Deployment", exact: true }).waitFor({ state: "hidden", timeout: 5000 });
  await page.getByRole("button", { name: "Copy ID", exact: true }).first().click();
  await waitForBodyText(page, "Copied");
}

async function exerciseObservability(page) {
  await visitRoute(page, "/dashboard/observability", "Agent Runs");
  await page.getByRole("button", { name: /obs_beta/i }).click();
  await waitForBodyText(page, "anthropic");
}

async function exerciseTraces(page) {
  await visitRoute(page, "/dashboard/traces", "Trace stream");
  await page.getByRole("button", { name: /run_beta/i }).click();
  await waitForBodyText(page, "deployment.blocked");
}

async function exerciseApiKeys(page) {
  await visitRoute(page, "/dashboard/api-keys", "Key registry");
  await page.getByLabel("Key name").fill("Smoke key");
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  await waitForBodyText(page, "Copy this secret now");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await waitForBodyText(page, "Copied");
}

async function exerciseWebhooks(page) {
  await visitRoute(page, "/dashboard/webhooks", "Add Webhook");
  await page.getByRole("button", { name: "Add Webhook", exact: true }).click();
  await page.getByRole("heading", { name: "Add New Webhook", exact: true }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("heading", { name: "Add New Webhook", exact: true }).waitFor({ state: "hidden", timeout: 5000 });
  await page.getByTitle("View delivery history").first().click();
  await waitForBodyText(page, "Delivery History");
}

async function exerciseControlCopy(page) {
  await visitRoute(page, "/dashboard/control", "Provider Wizard");
  await page.getByRole("button", { name: /mutx setup hosted --import-openclaw/i }).click();
  await waitForBodyText(page, "Copied");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseOrigin });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  try {
    await installMocks(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await dismissIntroIfPresent(page);

    for (const route of routeChecks) {
      process.stderr.write(`[dashboard-interactions-smoke] visiting ${route.path}\n`);
      await visitRoute(page, route.path, route.text);
    }

    await exerciseShell(page);
    await exerciseAgents(page);
    await exerciseDeployments(page);
    await exerciseObservability(page);
    await exerciseTraces(page);
    await exerciseApiKeys(page);
    await exerciseWebhooks(page);
    await exerciseControlCopy(page);

    assert.equal(pageErrors.length, 0, `Page errors encountered:\n${pageErrors.join("\n")}`);
    assert.equal(consoleErrors.length, 0, `Console errors encountered:\n${consoleErrors.join("\n")}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
