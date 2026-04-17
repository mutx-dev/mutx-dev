import { Activity } from "lucide-react";

import { DashboardOverviewPageClient } from "@/components/dashboard/DashboardOverviewPageClient";
import { DemoRoutePage } from "@/components/dashboard/DemoRoutePage";
import { DashboardSpaContent } from "@/components/dashboard/DashboardSpaContent";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import { getDashboardPanelFromSegments } from "@/lib/dashboardPanels";

function LegacyDashboardOverviewPage() {
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

export default async function DashboardCatchAllPage({
  params,
}: {
  params: Promise<{ panel?: string[] }>;
}) {
  const resolvedParams = await params;
  const panel = getDashboardPanelFromSegments(resolvedParams.panel);
  const spaShellEnabled = process.env.NEXT_PUBLIC_SPA_SHELL === "true";

  if (!spaShellEnabled && (!resolvedParams.panel || resolvedParams.panel.length === 0)) {
    return <LegacyDashboardOverviewPage />;
  }

  return (
    <DashboardSpaContent
      forcedPanel={panel}
      fallback={
        <DemoRoutePage
          title="Dashboard panel"
          description="This route does not have a dedicated MUTX panel yet."
          badge="panel route"
          notes={[
            "Keep the route reserved so future panel ports do not require another shell-level refactor.",
            "Use explicit panel mappings instead of letting route drift create two navigation systems.",
            "If this surface needs to go live, wire it into the shared SPA router instead of adding another one-off shell.",
          ]}
        />
      }
    />
  );
}
