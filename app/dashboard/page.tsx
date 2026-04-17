"use client";

import { Activity } from "lucide-react";

import { DashboardOverviewPageClient } from "@/components/dashboard/DashboardOverviewPageClient";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

/**
 * app/dashboard/page.tsx
 *
 * Fallback page for /dashboard root when NEXT_PUBLIC_SPA_SHELL=false (default).
 * Required for backward compatibility: without this, the catch-all
 * [[...panel]]/page.tsx returns null via SpaShellGuard when the flag is off,
 * leaving DashboardShell with no page content (blank /dashboard).
 *
 * When NEXT_PUBLIC_SPA_SHELL=true, [[...panel]]/page.tsx handles /dashboard
 * via the SPA shell (overview tab), and this file is not reached because
 * Next.js prefers the non-catch-all page.tsx for the exact /dashboard route.
 */
export default function DashboardPage() {
  return (
    <DesktopRouteBoundary
      routeKey="home"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Overview"
            description="Fleet posture, recent execution, alert pressure, delivery health, and operator budget state in one surface."
            icon={Activity}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="operator overview"
            stats={[
              { label: "Shell", value: "Canonical /dashboard" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <DashboardOverviewPageClient />
        </div>
      }
    />
  );
}
