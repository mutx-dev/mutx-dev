import { Bot } from "lucide-react";

import { AutonomyPageClient } from "@/components/dashboard/AutonomyPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardAutonomyPage() {
  return (
    <DesktopRouteBoundary
      routeKey="monitoring"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Autonomy"
            description="Local-only operator view for the live autonomy daemon, lane state, queue depth, active runners, and recent reports."
            icon={Bot}
            iconTone="text-fuchsia-300 bg-fuchsia-400/10"
            badge="local autonomy surface"
            hint={{
              tone: 'beta',
              detail:
                'Autonomy is tied directly to the local daemon and repo state. The feed is real, but the dashboard is still evolving around internal workflows.',
            }}
            stats={[
              { label: "Source", value: ".autonomy + queue", tone: "success" },
              { label: "Scope", value: "Daemon + lanes + reports" },
            ]}
          />

          <AutonomyPageClient />
        </div>
      }
    />
  );
}
