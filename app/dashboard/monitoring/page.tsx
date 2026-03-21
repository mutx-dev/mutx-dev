import { Activity } from "lucide-react";

import { MonitoringPageClient } from "@/components/dashboard/MonitoringPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardMonitoringPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Monitoring"
        description="Gateway health, live alerts, and honest control-plane status without placeholder observability chrome."
        icon={Activity}
        iconTone="text-sky-400 bg-sky-400/10"
        badge="monitoring surface"
        stats={[
          { label: "Scope", value: "Health + alerts" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <MonitoringPageClient />
    </div>
  );
}
