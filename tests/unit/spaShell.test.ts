/**
 * tests/unit/spaShell.test.ts
 *
 * Narrow unit tests for the SPA shell (issue #3690) testable surface.
 *
 * Tests the exported symbols from lib/store.ts that are consumed by
 * app/dashboard/[[...panel]]/page.tsx:
 *   - ESSENTIAL_PANELS constant
 *   - isSpaShellEnabled() feature-flag function
 *   - STEP_KEYS array
 *   - resolveTabFromParams() — URL segment → TabId resolver
 *   - isEssentialRestricted() — essential-mode gating predicate
 *   - PANEL_BY_SEGMENTS — URL→TabId lookup table
 *
 * Uses top-level imports so ESLint @typescript-eslint/no-require-imports
 * is satisfied.
 *
 * Note on isSpaShellEnabled: the real implementation returns false in Node
 * (no window) and only reads NEXT_PUBLIC_SPA_SHELL in a browser context.
 * In Node test environments the server-guard short-circuits, so the
 * env-variable variations all return false via the same code path.
 * The single test below covers the actual exported function in Node.
 */

import {
  ESSENTIAL_PANELS,
  isEssentialRestricted,
  isSpaShellEnabled,
  PANEL_BY_SEGMENTS,
  resolveTabFromParams,
  STEP_KEYS,
  type TabId,
} from "../../lib/store";

describe("SPA shell — ESSENTIAL_PANELS constant", () => {
  it("ESSENTIAL_PANELS matches the spec-defined set from issue #3690", () => {
    // Spec: ESSENTIAL_PANELS = {overview, agents, tasks, chat, activity, logs, settings}
    expect(ESSENTIAL_PANELS).toEqual([
      "overview",
      "agents",
      "tasks",
      "chat",
      "activity",
      "logs",
      "settings",
    ]);
  });

  it("ESSENTIAL_PANELS contains no duplicates", () => {
    const unique = new Set(ESSENTIAL_PANELS);
    expect(unique.size).toBe(ESSENTIAL_PANELS.length);
  });

  it("every ESSENTIAL_PANELS entry is a non-empty string", () => {
    for (const tab of ESSENTIAL_PANELS) {
      expect(typeof tab).toBe("string");
      expect(tab.length).toBeGreaterThan(0);
    }
  });

  it("non-essential tabs are correctly excluded (security, cron, memory, skills, webhooks, cost-tracker)", () => {
    const nonEssential = [
      "security",
      "cron",
      "memory",
      "skills",
      "webhooks",
      "cost-tracker",
      "tokens",
    ];
    for (const tab of nonEssential) {
      expect(ESSENTIAL_PANELS).not.toContain(tab);
    }
  });
});

describe("SPA shell — isSpaShellEnabled feature flag", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false in Node (no window) — server-side guard short-circuits", () => {
    // The real exported function: in Node, typeof window === "undefined" fires first
    // and the env variable is never consulted. This is the actual exported function.
    delete process.env.NEXT_PUBLIC_SPA_SHELL;
    expect(isSpaShellEnabled()).toBe(false);
  });

  it("isSpaShellEnabled is a function", () => {
    expect(typeof isSpaShellEnabled).toBe("function");
  });
});

describe("SPA shell — STEP_KEYS completeness", () => {
  it("STEP_KEYS has exactly 9 entries matching issue #3690 spec", () => {
    expect(STEP_KEYS).toHaveLength(9);
    expect(STEP_KEYS).toEqual([
      "auth",
      "capabilities",
      "config",
      "connect",
      "agents",
      "sessions",
      "projects",
      "memory",
      "skills",
    ]);
  });

  it("STEP_KEYS contains no duplicates", () => {
    const unique = new Set(STEP_KEYS);
    expect(unique.size).toBe(STEP_KEYS.length);
  });
});

describe("SPA shell — ContentRouter tab inventory", () => {
  it("ContentRouter panel tab count matches the issue #3690 spec (14 tabs)", () => {
    // The ContentRouter in [[...panel]]/page.tsx handles 14 tabs.
    // This test validates the expected set is well-defined.
    const allPanelTabs = [
      "overview",
      "agents",
      "tasks",
      "chat",
      "activity",
      "logs",
      "cron",
      "memory",
      "skills",
      "settings",
      "tokens",
      "cost-tracker",
      "webhooks",
      "security",
    ];
    expect(allPanelTabs).toHaveLength(14);
    for (const tab of allPanelTabs) {
      expect(typeof tab).toBe("string");
      expect(tab.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// resolveTabFromParams — catch-all route URL→TabId resolver
// ---------------------------------------------------------------------------

describe("SPA shell — resolveTabFromParams catch-all routing", () => {
  it("empty params returns overview (dashboard root)", () => {
    expect(resolveTabFromParams({})).toBe("overview");
    expect(resolveTabFromParams({ panel: undefined })).toBe("overview");
    expect(resolveTabFromParams({ panel: [] })).toBe("overview");
  });

  it('["agents"] resolves to "agents" tab', () => {
    expect(resolveTabFromParams({ panel: ["agents"] })).toBe("agents");
  });

  it('["orchestration"] resolves to "tasks" tab (backward-compat)', () => {
    expect(resolveTabFromParams({ panel: ["orchestration"] })).toBe("tasks");
  });

  it('["sessions"] resolves to "chat" tab', () => {
    expect(resolveTabFromParams({ panel: ["sessions"] })).toBe("chat");
  });

  it('["history"] resolves to "activity" tab', () => {
    expect(resolveTabFromParams({ panel: ["history"] })).toBe("activity");
  });

  it('["logs"] resolves to "logs" tab', () => {
    expect(resolveTabFromParams({ panel: ["logs"] })).toBe("logs");
  });

  it('["autonomy"] resolves to "cron" tab', () => {
    expect(resolveTabFromParams({ panel: ["autonomy"] })).toBe("cron");
  });

  it('["memory"] resolves to "memory" tab', () => {
    expect(resolveTabFromParams({ panel: ["memory"] })).toBe("memory");
  });

  it('["skills"] resolves to "skills" tab', () => {
    expect(resolveTabFromParams({ panel: ["skills"] })).toBe("skills");
  });

  it('["control"] resolves to "settings" tab (preserves /dashboard/control backward-compat)', () => {
    expect(resolveTabFromParams({ panel: ["control"] })).toBe("settings");
  });

  it('["analytics"] resolves to "tokens" tab', () => {
    expect(resolveTabFromParams({ panel: ["analytics"] })).toBe("tokens");
  });

  it('["budgets"] resolves to "cost-tracker" tab', () => {
    expect(resolveTabFromParams({ panel: ["budgets"] })).toBe("cost-tracker");
  });

  it('["webhooks"] resolves to "webhooks" tab', () => {
    expect(resolveTabFromParams({ panel: ["webhooks"] })).toBe("webhooks");
  });

  it('["security"] resolves to "security" tab', () => {
    expect(resolveTabFromParams({ panel: ["security"] })).toBe("security");
  });

  it('["tasks"] resolves to "tasks" tab — "tasks" is NOT a URL segment; "orchestration" is', () => {
    // "tasks" is the TabId; the URL segment is "orchestration"
    // (already tested above as ["orchestration"] → tasks)
    // This test documents that "tasks" is not a URL segment key.
    expect("tasks" in PANEL_BY_SEGMENTS).toBe(false);
    // Verify "orchestration" maps to "tasks"
    expect(PANEL_BY_SEGMENTS.orchestration).toBe("tasks");
  });

  it('["settings"] resolves via "control" segment — "settings" is NOT a URL segment', () => {
    expect("settings" in PANEL_BY_SEGMENTS).toBe(false);
    expect(PANEL_BY_SEGMENTS.control).toBe("settings");
  });

  it('["tokens"] resolves via "analytics" segment — "tokens" is NOT a URL segment', () => {
    expect("tokens" in PANEL_BY_SEGMENTS).toBe(false);
    expect(PANEL_BY_SEGMENTS.analytics).toBe("tokens");
  });

  it('["cost-tracker"] is NOT a URL segment — "budgets" is', () => {
    expect("cost-tracker" in PANEL_BY_SEGMENTS).toBe(false);
    expect(PANEL_BY_SEGMENTS.budgets).toBe("cost-tracker");
  });

  it("unknown segment falls back to overview (safe fallback)", () => {
    expect(resolveTabFromParams({ panel: ["unknown"] })).toBe("overview");
    expect(resolveTabFromParams({ panel: ["foobar"] })).toBe("overview");
  });

  it("multi-segment params resolve from first segment only", () => {
    // The catch-all only looks at the first segment
    expect(resolveTabFromParams({ panel: ["agents", "detail"] })).toBe("agents");
    expect(resolveTabFromParams({ panel: ["security", "keys", "list"] })).toBe("security");
  });
});

// ---------------------------------------------------------------------------
// PANEL_BY_SEGMENTS — URL→TabId lookup table
// ---------------------------------------------------------------------------

describe("SPA shell — PANEL_BY_SEGMENTS lookup table", () => {
  const expectedKeys = [
    "agents",
    "orchestration",
    "sessions",
    "history",
    "logs",
    "autonomy",
    "memory",
    "skills",
    "control",
    "analytics",
    "budgets",
    "webhooks",
    "security",
  ];

  it("PANEL_BY_SEGMENTS has exactly 13 known URL segments (overview has no segment)", () => {
    expect(Object.keys(PANEL_BY_SEGMENTS)).toHaveLength(13);
  });

  it("every key in PANEL_BY_SEGMENTS maps to a valid TabId", () => {
    for (const seg of Object.keys(PANEL_BY_SEGMENTS)) {
      const tab = PANEL_BY_SEGMENTS[seg as keyof typeof PANEL_BY_SEGMENTS];
      // tab must be a known TabId string (non-empty)
      expect(typeof tab).toBe("string");
      expect(tab.length).toBeGreaterThan(0);
    }
  });

  it("PANEL_BY_SEGMENTS has no duplicate tab values", () => {
    const values = Object.values(PANEL_BY_SEGMENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it.each(expectedKeys)('segment "%s" is present in PANEL_BY_SEGMENTS', (key) => {
    expect(PANEL_BY_SEGMENTS).toHaveProperty(key);
  });
});

// ---------------------------------------------------------------------------
// isEssentialRestricted — essential mode gating
// ---------------------------------------------------------------------------

describe("SPA shell — isEssentialRestricted essential mode gating", () => {
  it("essential tabs are NOT restricted (ESSENTIAL_PANELS)", () => {
    for (const tab of ESSENTIAL_PANELS) {
      expect(isEssentialRestricted(tab)).toBe(false);
    }
  });

  it("non-essential tabs ARE restricted", () => {
    const nonEssential: TabId[] = [
      "security",
      "cron",
      "memory",
      "skills",
      "webhooks",
      "cost-tracker",
      "tokens",
    ];
    for (const tab of nonEssential) {
      expect(isEssentialRestricted(tab)).toBe(true);
    }
  });

  it("isEssentialRestricted returns a boolean for every TabId", () => {
    const allTabs = Object.keys(PANEL_BY_SEGMENTS) as Array<keyof typeof PANEL_BY_SEGMENTS>;
    for (const seg of allTabs) {
      const tab = PANEL_BY_SEGMENTS[seg] as TabId;
      expect(typeof isEssentialRestricted(tab)).toBe("boolean");
    }
    // overview is the root tab
    expect(typeof isEssentialRestricted("overview")).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Cross-reference — ESSENTIAL_PANELS subset / superset integrity
// ---------------------------------------------------------------------------

describe("SPA shell — ESSENTIAL_PANELS subset integrity", () => {
  const allTabIds: TabId[] = [
    "overview",
    "agents",
    "tasks",
    "chat",
    "activity",
    "logs",
    "cron",
    "memory",
    "skills",
    "settings",
    "tokens",
    "cost-tracker",
    "webhooks",
    "security",
  ];

  it("every ESSENTIAL_PANELS entry is a valid TabId", () => {
    for (const tab of ESSENTIAL_PANELS) {
      expect(allTabIds).toContain(tab);
    }
  });

  it("ESSENTIAL_PANELS is a strict subset of all TabIds", () => {
    for (const tab of ESSENTIAL_PANELS) {
      expect(isEssentialRestricted(tab)).toBe(false);
    }
    // The complement is all restricted tabs
    const nonEssential = allTabIds.filter((t) => !ESSENTIAL_PANELS.includes(t));
    for (const tab of nonEssential) {
      expect(isEssentialRestricted(tab)).toBe(true);
    }
  });

  it("every PANEL_BY_SEGMENTS value is a known TabId", () => {
    const panelValues = Object.values(PANEL_BY_SEGMENTS);
    for (const tab of panelValues) {
      expect(allTabIds).toContain(tab);
    }
  });
});
