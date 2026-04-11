import { History } from "lucide-react";

import { ActivityFeed } from "@/components/app/activity-feed";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardHistoryPage() {
  return (
    <DesktopRouteBoundary
      routeKey="history"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="History"
            description="Recent agent and deployment activity, grouped into a readable audit trail with live refresh controls."
            icon={History}
            iconTone="text-violet-300 bg-violet-400/10"
            badge="activity surface"
            stats={[
              { label: "Scope", value: "Activity feed" },
              { label: "Source", value: "Live API", tone: "success" },
            ]}
          />

          <div className="dashboard-entry overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,33,0.96)_0%,rgba(10,14,20,0.98)_100%)] shadow-[0_18px_48px_rgba(1,5,11,0.24)]">
            <ActivityFeed autoRefresh showFilters className="min-h-[560px]" />
          </div>
        </div>
      }
    />
  );
}
