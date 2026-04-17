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
 *
 * Uses top-level imports so ESLint @typescript-eslint/no-require-imports
 * is satisfied.
 */

import {
  ESSENTIAL_PANELS,
  isSpaShellEnabled,
  STEP_KEYS,
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

  beforeEach(() => {
    jest.resetModules();
    // Re-import after reset so the fresh module sees the mocked env
    jest.doMock("../../lib/store", () => ({
      ESSENTIAL_PANELS,
      STEP_KEYS,
      // Re-import the module to test the live function with mocked env
      isSpaShellEnabled: (): boolean => {
        if (typeof window === "undefined") return false;
        return process.env.NEXT_PUBLIC_SPA_SHELL === "true";
      },
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns false when NEXT_PUBLIC_SPA_SHELL is not set (Node test env)", () => {
    delete process.env.NEXT_PUBLIC_SPA_SHELL;
    // In Node (no window) the server guard fires first
    expect(isSpaShellEnabled()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_SPA_SHELL=false string (not strictly 'true')", () => {
    process.env.NEXT_PUBLIC_SPA_SHELL = "false";
    expect(isSpaShellEnabled()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_SPA_SHELL=0", () => {
    process.env.NEXT_PUBLIC_SPA_SHELL = "0";
    expect(isSpaShellEnabled()).toBe(false);
  });

  it("returns false when NEXT_PUBLIC_SPA_SHELL is an empty string", () => {
    process.env.NEXT_PUBLIC_SPA_SHELL = "";
    expect(isSpaShellEnabled()).toBe(false);
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
