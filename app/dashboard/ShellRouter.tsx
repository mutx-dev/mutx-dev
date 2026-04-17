"use client";

/**
 * ShellRouter — client component that decides whether to render DashboardShell
 * or pass children through (SPA shell).
 *
 * BOTH conditions must be true to bypass DashboardShell:
 *   1. NEXT_PUBLIC_SPA_SHELL=true  (feature flag)
 *   2. The catch-all [[...panel]] page is rendering (no specific child page)
 *      — detected by checking layout segments at the dashboard layout level.
 *
 * This preserves backward compatibility: when the SPA flag is on, specific
 * /dashboard/* child routes still render with DashboardShell, while the SPA
 * catch-all renders with its own shell via ContentRouter.
 *
 * When NEXT_PUBLIC_SPA_SHELL=false (default): DashboardShell wraps everything,
 * matching the original behavior.
 */

import { useSelectedLayoutSegments } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export function ShellRouter({ children }: { children: React.ReactNode }) {
  // At the app/dashboard layout level, segments are:
  //   - []            when [[...panel]]/page.tsx renders (no sub-segment)
  //   - ["agents"]    when agents/page.tsx renders (specific child)
  //   - ["control"]   when control/page.tsx renders (specific child)
  //   - etc.
  // The catch-all page has no segments at the layout level — only when it
  // renders directly without a specific sub-route.
  const segments = useSelectedLayoutSegments("app/dashboard");

  // Empty segments at the dashboard layout level means the catch-all page
  // (or the bare /dashboard root) is rendering.  A non-empty array means a
  // specific child page won the route match and gets DashboardShell.
  const isCatchallRendering = segments.length === 0;

  const spaEnabled =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SPA_SHELL === "true";

  const useSpaShell = spaEnabled && isCatchallRendering;

  if (useSpaShell) {
    // SPA shell (NEXT_PUBLIC_SPA_SHELL=true): the catch-all page provides its
    // own shell/nav via ContentRouter — bypass DashboardShell to prevent
    // double-shell rendering.
    return <>{children}</>;
  }

  // Legacy multi-page shell: DashboardShell wraps every child route, including
  // specific /dashboard/* child pages (backward compatibility).
  return <DashboardShell>{children}</DashboardShell>;
}
