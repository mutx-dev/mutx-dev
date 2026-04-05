import { Activity } from "lucide-react";

import { MonitoringPageClient } from "@/components/dashboard/MonitoringPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardMonitoringPage() {
  return (
    <DesktopRouteBoundary
      routeKey="monitoring"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Monitoring"
            description="Live health, open alerts, and control-plane status at a glance."
            icon={Activity}
            iconTone="text-sky-400 bg-sky-400/10"
            badge="monitoring surface"
            stats={[
              { label: "Scope", value: "Health + alerts" },
              { label: "Source", value: "Live API", tone: "success" },
            ]}
          />

          <MonitoringPageClient />
        </div>
      }
    />
  );
}
