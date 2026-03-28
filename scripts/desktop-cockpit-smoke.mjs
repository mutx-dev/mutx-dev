#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const { version: mutxVersion } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);

const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const baseUrl = baseUrlArg ? baseUrlArg.slice("--base-url=".length) : "http://127.0.0.1:3001";
const HTTP_PROBE_TIMEOUT_MS = 15_000;
const PAGE_GOTO_TIMEOUT_MS = 15_000;
const PAGE_DEFAULT_TIMEOUT_MS = 10_000;
const READINESS_ROUTES = ["/dashboard", "/dashboard/agents", "/dashboard/control"];

function buildScenario({
  route,
  status,
  systemInfo,
  runtimeInspect,
  governance,
  sessions = [],
  apiMode = "ready",
  setupState,
}) {
  const defaultStatus = {
    mode: "local",
    apiUrl: "http://localhost:8000",
    apiHealth: "healthy",
    authenticated: true,
    user: {
      email: "mario@mutx.dev",
      name: "Mario",
      plan: "pro",
    },
    openclaw: {
      binaryPath: "/opt/homebrew/bin/openclaw",
      health: "healthy",
      gatewayUrl: "http://127.0.0.1:4318",
    },
    faramesh: {
      available: true,
      socketPath: "/tmp/faramesh.sock",
      health: "running",
    },
    uiServer: {
      ready: true,
      state: "ready",
      url: "http://127.0.0.1:18900",
      port: 18900,
      lastError: null,
      lastExitCode: null,
      attempt: 1,
    },
    localControlPlane: {
      ready: true,
      path: "/Users/fortune/.mutx/local-control",
      state: "ready",
      exists: true,
      lastError: null,
    },
    runtime: {
      state: "ready",
      lastError: null,
    },
    assistant: {
      found: true,
      name: "Operator Prime",
      agentId: "agent-123",
      workspace: "/Users/fortune/workspaces/operator-prime",
      gatewayStatus: "healthy",
      sessionCount: 2,
      state: "ready",
      lastError: null,
    },
    bridge: {
      ready: true,
      state: "ready",
      pythonCommand: "/opt/homebrew/bin/python3",
      scriptPath: "/Users/fortune/MUTX/cli/desktop_bridge.py",
      lastError: null,
      lastExitCode: null,
    },
    cliAvailable: true,
    mutxVersion,
    lastUpdated: new Date().toISOString(),
  };

  return {
    route,
    apiMode,
    status: {
      ...defaultStatus,
      ...status,
      openclaw: {
        ...defaultStatus.openclaw,
        ...(status?.openclaw || {}),
      },
      faramesh: {
        ...defaultStatus.faramesh,
        ...(status?.faramesh || {}),
      },
      uiServer: {
        ...defaultStatus.uiServer,
        ...(status?.uiServer || {}),
      },
      localControlPlane: {
        ...defaultStatus.localControlPlane,
        ...(status?.localControlPlane || {}),
      },
      runtime: {
        ...defaultStatus.runtime,
        ...(status?.runtime || {}),
      },
      assistant: {
        ...defaultStatus.assistant,
        ...(status?.assistant || {}),
      },
      bridge: {
        ...defaultStatus.bridge,
        ...(status?.bridge || {}),
      },
    },
    systemInfo: {
      mutx_version: mutxVersion,
      api_url: "http://localhost:8000",
      api_url_source: "config",
      authenticated: true,
      config_path: "/Users/fortune/.mutx/config.json",
      mutx_home: "/Users/fortune/.mutx",
      local_control_plane: {
        path: "/Users/fortune/.mutx/local-control",
        ready: true,
      },
      openclaw: {
        binary_path: "/opt/homebrew/bin/openclaw",
        health: {
          status: "healthy",
          cli_available: true,
          installed: true,
          onboarded: true,
          gateway_configured: true,
          gateway_reachable: true,
          gateway_port: 4318,
          gateway_url: "http://127.0.0.1:4318",
          credential_detected: true,
          config_path: "/Users/fortune/.config/openclaw/config.yaml",
          state_dir: "/Users/fortune/.local/state/openclaw",
          doctor_summary: "Gateway reachable and ready.",
        },
        manifest: {},
        bindings: [],
      },
      faramesh: {
        available: true,
        socket_path: "/tmp/faramesh.sock",
        health: {
          daemon_reachable: true,
          doctor_summary: "Daemon healthy.",
        },
        policy_path: "/Users/fortune/.mutx/policies/default.yaml",
      },
      cli_available: true,
      ...systemInfo,
    },
    runtimeInspect: {
      openclaw: {
        binary_path: "/opt/homebrew/bin/openclaw",
        gateway_url: "http://127.0.0.1:4318",
        config_path: "/Users/fortune/.config/openclaw/config.yaml",
        privacy_summary: "Gateway keys stay on the operator machine.",
        keys_remain_local: true,
      },
      faramesh: {},
      local_control_plane: {
        ready: true,
        path: "/Users/fortune/.mutx/local-control",
      },
      ...runtimeInspect,
    },
    governance: {
      provider: "faramesh",
      status: "active",
      version: "1.0.0",
      decisions_total: 18,
      permits_today: 8,
      denies_today: 1,
      defers_today: 1,
      pending_approvals: 2,
      last_decision_at: new Date().toISOString(),
      ...governance,
    },
    sessions,
    setupState: {
      provider: "openclaw",
      status: "ready",
      current_step: "verify",
      completed_steps: ["preflight", "mode", "auth", "runtime", "assistant", "verify"],
      failed_step: null,
      last_error: null,
      steps: [
        { id: "preflight", title: "Environment", completed: true },
        { id: "mode", title: "Target", completed: true },
        { id: "auth", title: "Identity", completed: true },
        { id: "runtime", title: "Runtime", completed: true },
        { id: "assistant", title: "Assistant", completed: true },
        { id: "verify", title: "Control", completed: true },
      ],
      providers: [{ id: "openclaw", label: "OpenClaw", summary: "Native runtime", enabled: true }],
      ...(setupState || {}),
    },
  };
}

const READY_ROUTE_SCENARIOS = [
  {
    name: "home_ready",
    route: "/dashboard",
    expectText: ["Mission Control", "Operator home, posture, and high-level recovery."],
    rejectText: ["Spawn Lab", "Failure Logs", "Channels", "Skills"],
  },
  { name: "agents_ready", route: "/dashboard/agents", expectText: ["Agents", "Desktop operator context", "Agent Registry"] },
  { name: "deployments_ready", route: "/dashboard/deployments", expectText: ["Deployments", "Desktop operator context"] },
  { name: "runs_ready", route: "/dashboard/runs", expectText: ["Runs", "Desktop operator context", "Run Queue"] },
  { name: "monitoring_ready", route: "/dashboard/monitoring", expectText: ["Monitoring", "Desktop operator context", "Alert rail"] },
  { name: "traces_ready", route: "/dashboard/traces", expectText: ["Traces", "Desktop operator context", "Traceable runs"] },
  { name: "observability_ready", route: "/dashboard/observability", expectText: ["Observability", "Desktop operator context", "Observability feed"] },
  { name: "sessions_ready", route: "/dashboard/sessions", expectText: ["Sessions", "Desktop operator context", "Cloud session registry"] },
  { name: "api_keys_ready", route: "/dashboard/api-keys", expectText: ["API Keys", "Desktop operator context", "Key ledger"] },
  { name: "budgets_ready", route: "/dashboard/budgets", expectText: ["Budgets", "Desktop operator context", "Budget usage events"] },
  { name: "analytics_ready", route: "/dashboard/analytics", expectText: ["Analytics", "Desktop operator context", "Run trend samples"] },
  { name: "webhooks_ready", route: "/dashboard/webhooks", expectText: ["Webhooks", "Desktop operator context", "Webhook endpoints"] },
  { name: "security_ready", route: "/dashboard/security", expectText: ["Security", "Desktop operator context", "Operator security posture"] },
  { name: "orchestration_ready", route: "/dashboard/orchestration", expectText: ["Orchestration", "Desktop operator context", "Orchestration lane"] },
  { name: "memory_ready", route: "/dashboard/memory", expectText: ["Memory", "Desktop operator context", "Memory posture"] },
  { name: "swarm_ready", route: "/dashboard/swarm", expectText: ["Swarm", "Desktop operator context", "Swarm topology"] },
  { name: "channels_ready", route: "/dashboard/channels", expectText: ["Channels", "Desktop operator context", "Channel posture"] },
  { name: "history_ready", route: "/dashboard/history", expectText: ["History", "Desktop operator context", "Operator history"] },
  { name: "skills_ready", route: "/dashboard/skills", expectText: ["Skills", "Desktop operator context", "Installed skills"] },
  { name: "spawn_ready", route: "/dashboard/spawn", expectText: ["Spawn", "Desktop operator context", "Spawn new operator asset"] },
  { name: "logs_ready", route: "/dashboard/logs", expectText: ["Logs", "Desktop operator context", "Machine logs and failures"] },
  { name: "control_ready", route: "/dashboard/control", expectText: ["Settings", "Operator Account"], rejectText: ["Show Mirror", "Advanced / Web Mirror"] },
];

const MATRIX_SCENARIOS = [
  {
    name: "agents_unauthenticated",
    scenario: buildScenario({
      route: "/dashboard/agents",
      apiMode: "unauthenticated",
      status: {
        authenticated: false,
        user: null,
        assistant: {
          found: false,
          name: null,
          agentId: null,
          workspace: null,
          gatewayStatus: null,
          sessionCount: 0,
        },
      },
      systemInfo: {
        authenticated: false,
      },
    }),
    expectText: ["Operator session required", "Local Bootstrap", "Desktop-first operator context"],
    click: ["Local Bootstrap", "Bootstrap Locally"],
    expectCalls: ["auth.storeTokens"],
  },
  {
    name: "sessions_assistant_required",
    scenario: buildScenario({
      route: "/dashboard/sessions",
      status: {
        authenticated: true,
        assistant: {
          found: false,
          name: null,
          agentId: null,
          workspace: null,
          gatewayStatus: null,
          sessionCount: 0,
        },
      },
    }),
    expectText: ["Assistant binding required", "Run Real Setup"],
    click: ["Run Real Setup"],
    expectCalls: ["setup.start"],
  },
  {
    name: "monitoring_bridge_failure",
    scenario: buildScenario({
      route: "/dashboard/monitoring",
      status: {
        bridge: {
          ready: false,
          state: "error",
          pythonCommand: "/usr/bin/python3",
          scriptPath: "/Users/fortune/MUTX/cli/desktop_bridge.py",
          lastError: "Bridge exited with code: 1",
          lastExitCode: 1,
        },
      },
    }),
    expectText: ["Bridge recovery", "/usr/bin/python3", "Bridge exited with code: 1"],
    click: [],
    expectCalls: [],
  },
  {
    name: "agents_cloud_error",
    scenario: buildScenario({
      route: "/dashboard/agents",
      apiMode: "error",
    }),
    expectText: ["Cloud route degraded", "Desktop operator context"],
    allowedConsoleSubstrings: ["503 (Service Unavailable)"],
    click: [],
    expectCalls: [],
  },
  {
    name: "home_first_run",
    scenario: buildScenario({
      route: "/dashboard",
      status: {
        mode: "unknown",
        apiUrl: null,
        authenticated: false,
        user: null,
        openclaw: {
          binaryPath: null,
          health: "unknown",
          gatewayUrl: null,
        },
        faramesh: {
          available: false,
          socketPath: null,
          health: "unknown",
        },
        localControlPlane: {
          ready: false,
          path: null,
        },
        assistant: {
          found: false,
          name: null,
          agentId: null,
          workspace: null,
          gatewayStatus: null,
          sessionCount: 0,
        },
      },
      systemInfo: {
        authenticated: false,
        api_url: "https://api.mutx.dev",
        local_control_plane: {
          path: "/Users/fortune/.mutx/local-control",
          ready: false,
        },
        openclaw: {
          binary_path: null,
          health: {
            status: "missing",
            cli_available: true,
            installed: false,
            onboarded: false,
            gateway_configured: false,
            gateway_reachable: false,
            gateway_port: null,
            gateway_url: null,
            credential_detected: false,
            config_path: null,
            state_dir: null,
            doctor_summary: "OpenClaw is not installed on this machine.",
          },
          manifest: {},
          bindings: [],
        },
      },
      runtimeInspect: {
        openclaw: {
          binary_path: null,
          gateway_url: null,
        },
        local_control_plane: {
          ready: false,
          path: "/Users/fortune/.mutx/local-control",
        },
      },
      governance: {
        status: "idle",
      },
    }),
    expectText: ["Use the whole window like an operator desk, not a web dashboard.", "Session Pending", "Start Local Stack"],
    click: ["Open TUI", "Open Terminal", "Start Local Stack"],
    expectCalls: ["runtime.openSurface", "system.openTerminal", "controlPlane.start"],
  },
  {
    name: "workspace_navigation_stable",
    scenario: buildScenario({
      route: "/dashboard",
    }),
    expectText: ["Mission Control"],
    click: [{ label: "Assistants", exact: false }],
    postClickExpectText: ["Agent Registry"],
    expectPathname: "/dashboard",
    expectCalls: ["windows.setState"],
  },
  {
    name: "home_wide_layout",
    scenario: buildScenario({
      route: "/dashboard",
    }),
    viewport: { width: 1920, height: 1180 },
    expectText: ["Operator Rail", "Runtime Topology", "Operator Feed"],
    click: [],
    expectCalls: [],
    layoutChecks: [
      { target: "Runtime Topology", against: "Operator Rail", axis: "x", relation: "greaterThan" },
      { target: "Operator Feed", against: "Runtime Topology", axis: "x", relation: "greaterThan" },
    ],
  },
  {
    name: "traces_tab_switch_stable",
    scenario: buildScenario({
      route: "/dashboard/traces",
    }),
    expectText: ["Traceable runs"],
    click: ["Logs"],
    postClickExpectText: ["Machine logs and failures"],
    expectPathname: "/dashboard/traces",
    expectCalls: ["windows.setState"],
  },
];

const scenarios = [
  ...READY_ROUTE_SCENARIOS.map((routeScenario) => ({
    name: routeScenario.name,
    scenario: buildScenario({ route: routeScenario.route }),
    expectText: routeScenario.expectText,
    rejectText: routeScenario.rejectText || [],
    click: [],
    expectCalls: [],
  })),
  ...MATRIX_SCENARIOS,
];

function buildApiResponse(pathname, searchParams) {
  if (pathname === "/api/auth/me") {
    return {
      status: 200,
      body: {
        email: "mario@mutx.dev",
        name: "Mario",
        plan: "pro",
      },
    };
  }

  if (pathname === "/api/dashboard/agents") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "agent-123",
            name: "Operator Prime",
            description: "Primary desktop operator",
            type: "openai",
            status: "running",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/deployments") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "deploy-123",
            agent_id: "agent-123",
            replicas: 2,
            status: "running",
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/runs") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "run-123",
            agent_id: "agent-123",
            status: "completed",
            trace_count: 2,
            started_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/health") {
    return {
      status: 200,
      body: {
        status: "healthy",
        database: "ready",
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (pathname === "/api/dashboard/monitoring/alerts") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "alert-1",
            type: "gateway_warning",
            message: "Gateway latency spiked briefly.",
            resolved: false,
            created_at: new Date().toISOString(),
            agent_id: "agent-123",
          },
        ],
      },
    };
  }

  if (/^\/api\/dashboard\/runs\/[^/]+\/traces$/.test(pathname)) {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "trace-1",
            event_type: "tool.call",
            message: "Issued runtime health probe.",
            sequence: 1,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/observability") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "obs-1",
            event_type: "run.metric",
            message: "Latency within target window.",
            status: "healthy",
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/sessions") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "sess-cloud-1",
            agent: "Operator Prime",
            channel: "desktop",
            model: "gpt-5.4",
            active: true,
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/assistant/overview") {
    return {
      status: 200,
      body: {
        assistant: {
          name: "Operator Prime",
          workspace: "/Users/fortune/workspaces/operator-prime",
          channels: [{ id: "desktop", enabled: true }],
          gateway: { status: "healthy", gateway_url: "http://127.0.0.1:4318" },
        },
      },
    };
  }

  if (pathname === "/api/api-keys") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "key-1234567890",
            name: "Operator key",
            status: "active",
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/budgets") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "budget-1",
            credits_remaining: 2100,
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/budgets/usage") {
    return {
      status: 200,
      body: {
        items: [{ id: "usage-1", amount: 120 }],
      },
    };
  }

  if (pathname === "/api/dashboard/usage/events") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "usage-event-1",
            event_type: "model.tokens",
            message: "Desktop session consumed 1200 tokens.",
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/analytics/summary") {
    return {
      status: 200,
      body: {
        total_agents: 1,
        active_agents: 1,
        total_deployments: 1,
        active_deployments: 1,
        total_runs: 42,
        successful_runs: 39,
        failed_runs: 3,
        total_api_calls: 120,
        avg_latency_ms: 220,
        period_start: "2026-03-01T00:00:00.000Z",
        period_end: "2026-03-26T00:00:00.000Z",
      },
    };
  }

  if (pathname === "/api/dashboard/analytics/timeseries") {
    return {
      status: 200,
      body: {
        metric: searchParams.get("metric"),
        interval: searchParams.get("interval"),
        data: [
          {
            timestamp: new Date().toISOString(),
            value: searchParams.get("metric") === "latency" ? 220 : 5,
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/analytics/costs") {
    return {
      status: 200,
      body: {
        total_credits_used: 640,
        credits_remaining: 2100,
        credits_total: 2740,
        usage_by_event_type: { "model.tokens": 640 },
        usage_by_agent: { "agent-123": 640 },
      },
    };
  }

  if (pathname === "/api/webhooks") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "wh-1",
            url: "https://example.com/webhooks/mutx",
            events: ["run.completed", "deployment.failed"],
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  if (pathname === "/api/dashboard/swarms") {
    return {
      status: 200,
      body: {
        items: [
          {
            id: "swarm-1",
            name: "Primary swarm",
            status: "running",
          },
        ],
      },
    };
  }

  return {
    status: 200,
    body: { success: true },
  };
}

async function installApiMocks(page, scenario) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (scenario.apiMode === "error" && method === "GET") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Cloud route unavailable" }),
      });
      return;
    }

    if (
      scenario.apiMode === "unauthenticated" &&
      method === "GET" &&
      (pathname.startsWith("/api/dashboard") || pathname.startsWith("/api/api-keys") || pathname === "/api/auth/me" || pathname.startsWith("/api/webhooks"))
    ) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Unauthorized" }),
      });
      return;
    }

    if (pathname === "/api/auth/local-bootstrap" && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "local-access-token",
          refresh_token: "local-refresh-token",
        }),
      });
      return;
    }

    if ((pathname === "/api/auth/login" || pathname === "/api/auth/register") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
        }),
      });
      return;
    }

    const response = buildApiResponse(pathname, url.searchParams);
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  });
}

function installDesktopMock() {
  return (scenarioInput) => {
    const navigateListeners = [];
    const statusListeners = [];
    const windowStateListeners = [];
    const calls = [];
    const ok = (payload = {}) => Promise.resolve({ success: true, ...payload });
    const record = (name, payload) => {
      calls.push({ name, payload });
      return ok();
    };

    const resolveWorkspacePane = (route) => {
      switch (route) {
        case "/dashboard/agents":
          return "fleet";
        case "/dashboard/deployments":
          return "rollouts";
        case "/dashboard/runs":
          return "operations";
        case "/dashboard/monitoring":
          return "monitoring";
        case "/dashboard/api-keys":
          return "api-keys";
        case "/dashboard/budgets":
          return "budgets";
        case "/dashboard/analytics":
          return "analytics";
        case "/dashboard/webhooks":
          return "webhooks";
        case "/dashboard/security":
          return "security";
        case "/dashboard/orchestration":
          return "automation";
        case "/dashboard/memory":
          return "memory";
        case "/dashboard/swarm":
          return "swarm";
        case "/dashboard/channels":
          return "channels";
        case "/dashboard/history":
          return "history";
        case "/dashboard/skills":
          return "skills";
        case "/dashboard/spawn":
          return "spawn";
        case "/dashboard/logs":
          return "logs";
        default:
          return "overview";
      }
    };

    const resolveRoleForRoute = (route) => {
      if (route === "/dashboard/control") {
        return "settings";
      }
      if (route === "/dashboard/sessions") {
        return "sessions";
      }
      if (route === "/dashboard/traces" || route === "/dashboard/logs") {
        return "traces";
      }
      return "workspace";
    };

    const resolvePayloadForRoute = (role, route, payload = {}) => {
      if (role === "settings") {
        return { pane: "account", ...payload };
      }
      if (role === "traces") {
        return { tab: route === "/dashboard/logs" ? "logs" : "timeline", ...payload };
      }
      if (role === "sessions") {
        return { tab: "live", ...payload };
      }
      return { pane: resolveWorkspacePane(route), ...payload };
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));
    let currentRole = resolveRoleForRoute(scenarioInput.route);
    let windowsState = {
      activeRole: currentRole,
      windows: {
        workspace: {
          role: "workspace",
          title: "Workspace",
          route: currentRole === "workspace" ? scenarioInput.route : "/dashboard",
          payload: resolvePayloadForRoute(
            "workspace",
            currentRole === "workspace" ? scenarioInput.route : "/dashboard",
          ),
          visible: true,
          focused: currentRole === "workspace",
          maximized: false,
        },
        sessions: {
          role: "sessions",
          title: "Sessions",
          route: currentRole === "sessions" ? scenarioInput.route : "/dashboard/sessions",
          payload: resolvePayloadForRoute(
            "sessions",
            currentRole === "sessions" ? scenarioInput.route : "/dashboard/sessions",
          ),
          visible: currentRole === "sessions",
          focused: currentRole === "sessions",
          maximized: false,
        },
        traces: {
          role: "traces",
          title: "Traces",
          route:
            currentRole === "traces"
              ? scenarioInput.route
              : "/dashboard/traces",
          payload: resolvePayloadForRoute(
            "traces",
            currentRole === "traces" ? scenarioInput.route : "/dashboard/traces",
          ),
          visible: currentRole === "traces",
          focused: currentRole === "traces",
          maximized: false,
        },
        settings: {
          role: "settings",
          title: "Settings",
          route: currentRole === "settings" ? scenarioInput.route : "/dashboard/control",
          payload: resolvePayloadForRoute(
            "settings",
            currentRole === "settings" ? scenarioInput.route : "/dashboard/control",
          ),
          visible: currentRole === "settings",
          focused: currentRole === "settings",
          maximized: false,
        },
      },
    };

    const getCurrentWindowState = () => ({
      currentRole,
      currentWindow: clone(windowsState.windows[currentRole]),
      state: clone(windowsState),
    });

    const emitWindowState = () => {
      const snapshot = clone(windowsState);
      windowStateListeners.forEach((callback) => callback(snapshot));
      return snapshot;
    };

    const updateWindowRole = (role, route, payload = {}) => {
      currentRole = role;
      windowsState = {
        ...windowsState,
        activeRole: role,
        windows: {
          ...windowsState.windows,
          workspace: {
            ...windowsState.windows.workspace,
            focused: role === "workspace",
            visible: windowsState.windows.workspace.visible || role === "workspace",
          },
          sessions: {
            ...windowsState.windows.sessions,
            focused: role === "sessions",
            visible: windowsState.windows.sessions.visible || role === "sessions",
          },
          traces: {
            ...windowsState.windows.traces,
            focused: role === "traces",
            visible: windowsState.windows.traces.visible || role === "traces",
          },
          settings: {
            ...windowsState.windows.settings,
            focused: role === "settings",
            visible: windowsState.windows.settings.visible || role === "settings",
          },
          [role]: {
            ...windowsState.windows[role],
            route,
            payload: {
              ...windowsState.windows[role].payload,
              ...payload,
            },
            visible: true,
            focused: true,
          },
        },
      };
      return emitWindowState();
    };

    window.__mutxCalls = calls;
    window.mutxDesktop = {
      platform: "darwin",
      isDesktop: true,
      getAppVersion: async () => mutxVersion,
      getPlatform: async () => "darwin",
      getUserDataPath: async () => "/Users/fortune/Library/Application Support/MUTX",
      getDesktopStatus: async () => scenarioInput.status,
      getRuntimeContext: async () => ({
        mode: scenarioInput.status.mode,
        apiUrl: scenarioInput.systemInfo.api_url,
        updatedAt: new Date().toISOString(),
      }),
      setRuntimeContext: async (updates) => ({
        mode: updates.mode || scenarioInput.status.mode,
        apiUrl: updates.apiUrl || scenarioInput.systemInfo.api_url,
        updatedAt: new Date().toISOString(),
      }),
      openExternal: async (url) => {
        calls.push({ name: "openExternal", payload: url });
      },
      showNotification: async () => true,
      minimizeWindow: async () => {},
      maximizeWindow: async () => {},
      closeWindow: async () => {},
      isWindowMaximized: async () => false,
      app: {
        openPreferences: async (pane) => {
          calls.push({ name: "app.openPreferences", payload: pane });
          updateWindowRole("settings", "/dashboard/control", resolvePayloadForRoute("settings", "/dashboard/control", { pane }));
          return clone(windowsState);
        },
      },
      windows: {
        open: async (role, payload = {}, route) => {
          calls.push({ name: "windows.open", payload: { role, payload, route } });
          const nextRoute =
            route ||
            (role === "settings"
              ? "/dashboard/control"
              : role === "sessions"
                ? "/dashboard/sessions"
                : role === "traces"
                  ? "/dashboard/traces"
                  : "/dashboard");
          updateWindowRole(role, nextRoute, resolvePayloadForRoute(role, nextRoute, payload));
          return clone(windowsState);
        },
        focus: async (role) => {
          calls.push({ name: "windows.focus", payload: { role } });
          updateWindowRole(role, windowsState.windows[role].route, windowsState.windows[role].payload);
          return clone(windowsState);
        },
        close: async (role) => {
          calls.push({ name: "windows.close", payload: { role } });
          windowsState = {
            ...windowsState,
            windows: {
              ...windowsState.windows,
              [role]: {
                ...windowsState.windows[role],
                visible: false,
                focused: false,
              },
            },
          };
          emitWindowState();
          return clone(windowsState);
        },
        getState: async () => clone(windowsState),
        getCurrent: async () => getCurrentWindowState(),
        setState: async (updates = {}) => {
          calls.push({ name: "windows.setState", payload: updates });
          const current = windowsState.windows[currentRole];
          const nextRoute = updates.route || current.route;
          updateWindowRole(currentRole, nextRoute, {
            ...current.payload,
            ...(updates.payload || {}),
          });
          return getCurrentWindowState();
        },
      },
      ui: {
        showContextMenu: async (items) => {
          calls.push({ name: "ui.showContextMenu", payload: items });
          return { success: true };
        },
      },
      navigate: (route) => {
        calls.push({ name: "navigate", payload: route });
      },
      openOnboarding: () => {},
      showMainWindow: () => {},
      onNavigate: (callback) => {
        navigateListeners.push(callback);
        return () => {};
      },
      onDesktopStatusChanged: (callback) => {
        statusListeners.push(callback);
        return () => {};
      },
      onWindowStateChanged: (callback) => {
        windowStateListeners.push(callback);
        return () => {};
      },
      onDoctorResult: () => () => {},
      removeNavigateListener: () => {},
      removeDesktopStatusListener: () => {},
      removeWindowStateListener: () => {},
      removeDoctorResultListener: () => {},
      bridge: {
        call: async () => ({}),
        systemInfo: async () => scenarioInput.systemInfo,
        auth: {
          status: async () => ({
            authenticated: scenarioInput.status.authenticated,
            api_url: scenarioInput.systemInfo.api_url,
            user: scenarioInput.status.user,
          }),
          login: async () => ok(),
          register: async () => ok(),
          localBootstrap: async () => ok(),
          storeTokens: async (...args) => {
            calls.push({ name: "auth.storeTokens", payload: args });
            return ok();
          },
          logout: async () => ok(),
        },
        doctor: {
          run: async () => ({
            api_health: "ok",
            api_url: scenarioInput.systemInfo.api_url,
            openclaw: {
              status: scenarioInput.systemInfo.openclaw?.health?.status || "unknown",
              doctor_summary: scenarioInput.systemInfo.openclaw?.health?.doctor_summary || "unknown",
            },
            assistant: scenarioInput.status.assistant?.found
              ? {
                  name: scenarioInput.status.assistant.name,
                  workspace: scenarioInput.status.assistant.workspace,
                }
              : null,
          }),
        },
        setup: {
          inspectEnvironment: async () => scenarioInput.systemInfo,
          start: async (...args) => {
            calls.push({ name: "setup.start", payload: args });
            return {
              success: true,
              assistant_id: "assistant-1",
              workspace: "/Users/fortune/workspaces/operator-prime",
            };
          },
          getState: async () => scenarioInput.setupState,
        },
        runtime: {
          inspect: async () => scenarioInput.runtimeInspect,
          resync: async () => record("runtime.resync"),
          openSurface: async (surface) => record("runtime.openSurface", surface),
        },
        controlPlane: {
          status: async () => ({
            ready: scenarioInput.status.localControlPlane?.ready || false,
            path: scenarioInput.systemInfo.local_control_plane.path,
            exists: true,
          }),
          start: async () => record("controlPlane.start"),
          stop: async () => record("controlPlane.stop"),
        },
        assistant: {
          overview: async () =>
            scenarioInput.status.assistant?.found
              ? {
                  found: true,
                  name: scenarioInput.status.assistant.name,
                  agent_id: scenarioInput.status.assistant.agentId,
                  assistant_id: "assistant-1",
                  status: "ready",
                  onboarding_status: "complete",
                  workspace: scenarioInput.status.assistant.workspace,
                  session_count: scenarioInput.status.assistant.sessionCount,
                  deployments: [{ id: "deploy-123", status: "running" }],
                  installed_skills: [{ id: "skill-1", name: "Release Operator" }],
                  gateway: {
                    status: scenarioInput.status.assistant.gatewayStatus,
                    gateway_url: "http://127.0.0.1:4318",
                  },
                }
              : { found: false },
          sessions: async () =>
            scenarioInput.sessions.length > 0
              ? scenarioInput.sessions
              : [
                  {
                    id: "sess-local-1",
                    channel: "desktop",
                    kind: "chat",
                    model: "gpt-5.4",
                    age: "2m",
                    active: true,
                    agent: "Operator Prime",
                    tokens: "1.2k tokens",
                  },
                ],
        },
        agents: {
          list: async () => [],
          create: async () => ok({ id: "agent-1" }),
          stop: async () => ok(),
        },
        governance: {
          status: async () => scenarioInput.governance,
          restart: async () => record("governance.restart"),
        },
        system: {
          revealInFinder: async (path) => record("system.revealInFinder", path),
          openTerminal: async (cwd) => record("system.openTerminal", cwd),
          chooseWorkspace: async () => ({ success: true, path: "/tmp/workspace" }),
        },
      },
    };
  };
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function warmServer() {
  const warmupUrls = ["/", "/dashboard"];

  for (const path of warmupUrls) {
    try {
      await fetchWithTimeout(`${baseUrl}${path}`, HTTP_PROBE_TIMEOUT_MS);
      return;
    } catch {
      await delay(250);
    }
  }
}

async function probeRoutes() {
  const results = [];

  for (const route of READINESS_ROUTES) {
    const startedAt = Date.now();

    try {
      const response = await fetchWithTimeout(`${baseUrl}${route}`, HTTP_PROBE_TIMEOUT_MS);
      results.push({
        route,
        ok: response.ok,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      results.push({
        route,
        ok: false,
        status: null,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function runScenario(browser, item) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.setDefaultTimeout(PAGE_DEFAULT_TIMEOUT_MS);

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await installApiMocks(page, item.scenario);
  await page.addInitScript(installDesktopMock(item.scenario), item.scenario);
  if (item.viewport) {
    await page.setViewportSize(item.viewport);
  }
  await page.goto(`${baseUrl}${item.scenario.route}`, {
    waitUntil: "domcontentloaded",
    timeout: PAGE_GOTO_TIMEOUT_MS,
  });
  await page.waitForTimeout(1500);

  const bodyText = await page.locator("body").innerText();
  const normalizedBodyText = bodyText.toUpperCase();
  const missingText = item.expectText.filter(
    (text) => !normalizedBodyText.includes(text.toUpperCase()),
  );
  const rejectText = (item.rejectText || []).filter((text) =>
    normalizedBodyText.includes(text.toUpperCase()),
  );

  for (const clickTarget of item.click) {
    const label = typeof clickTarget === "string" ? clickTarget : clickTarget.label;
    const exact = typeof clickTarget === "string" ? true : clickTarget.exact ?? true;
    await page.getByRole("button", { name: label, exact }).first().click();
    await page.waitForTimeout(200);
  }

  const postClickBodyText = item.postClickExpectText?.length
    ? await page.locator("body").innerText()
    : "";
  const normalizedPostClickBodyText = postClickBodyText.toUpperCase();
  const missingPostClickText = (item.postClickExpectText || []).filter(
    (text) => !normalizedPostClickBodyText.includes(text.toUpperCase()),
  );
  const pathnameMismatch =
    item.expectPathname && new URL(page.url()).pathname !== item.expectPathname
      ? {
          expected: item.expectPathname,
          actual: new URL(page.url()).pathname,
        }
      : null;

  const calls = await page.evaluate(() => window.__mutxCalls || []);
  const missingCalls = item.expectCalls.filter(
    (name) => !calls.some((entry) => entry.name === name),
  );

  const layoutFailures = [];
  for (const check of item.layoutChecks || []) {
    const targetBox = await page.getByText(check.target, { exact: true }).first().boundingBox();
    const againstBox = await page.getByText(check.against, { exact: true }).first().boundingBox();

    if (!targetBox || !againstBox) {
      layoutFailures.push(`Could not resolve layout boxes for ${check.target} vs ${check.against}`);
      continue;
    }

    const targetValue = check.axis === "x" ? targetBox.x : targetBox.y;
    const againstValue = check.axis === "x" ? againstBox.x : againstBox.y;
    const passed =
      check.relation === "greaterThan" ? targetValue > againstValue : targetValue < againstValue;

    if (!passed) {
      layoutFailures.push(
        `${check.target} expected ${check.axis} ${check.relation} ${check.against} (${targetValue} vs ${againstValue})`,
      );
    }
  }

  await context.close();

  const remainingConsoleErrors = consoleErrors.filter(
    (message) =>
      !(item.allowedConsoleSubstrings || []).some((substring) => message.includes(substring)),
  );

  return {
    name: item.name,
    ok:
      missingText.length === 0 &&
      missingPostClickText.length === 0 &&
      !pathnameMismatch &&
      rejectText.length === 0 &&
      missingCalls.length === 0 &&
      layoutFailures.length === 0 &&
      remainingConsoleErrors.length === 0,
    missingText,
    missingPostClickText,
    pathnameMismatch,
    rejectText,
    missingCalls,
    layoutFailures,
    consoleErrors: remainingConsoleErrors,
    sample: bodyText.slice(0, 500),
  };
}

async function main() {
  await warmServer();
  const routeChecks = await probeRoutes();
  const failedChecks = routeChecks.filter((check) => !check.ok);

  if (failedChecks.length > 0) {
    process.stdout.write(
      `${JSON.stringify({ baseUrl, routeChecks, results: [] }, null, 2)}\n`,
    );
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const item of scenarios) {
      process.stderr.write(`[desktop-cockpit-smoke] running ${item.name}\n`);
      try {
        results.push(await runScenario(browser, item));
      } catch (error) {
        results.push({
          name: item.name,
          ok: false,
          missingText: [],
          rejectText: [],
          missingCalls: [],
          consoleErrors: [],
          sample: "",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.ok);
  process.stdout.write(`${JSON.stringify({ baseUrl, routeChecks, results }, null, 2)}\n`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
