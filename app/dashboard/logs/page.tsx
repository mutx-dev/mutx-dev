import { TerminalSquare } from "lucide-react";

import { LogsPageClient } from "@/components/dashboard/LogsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardLogsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="logs"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Logs"
            description="Real-time step timeline and execution log for agent runs. Click any run to inspect its step sequence."
            icon={TerminalSquare}
            iconTone="text-slate-200 bg-white/10"
            badge="execution trace"
            stats={[
              { label: "Source", value: "Observability API" },
              { label: "Data", value: "Live", tone: "success" },
            ]}
          />

          <LogsPageClient />
        </div>
      }
    />
  );
}
