import { GitBranchPlus } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { SwarmsPageClient } from "@/components/dashboard/SwarmsPageClient";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardSwarmPage() {
  return (
    <DesktopRouteBoundary
      routeKey="swarm"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Swarm"
            description="Grouped agent topology and coordinated replica posture from the live swarm contract."
            icon={GitBranchPlus}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="swarm surface"
            stats={[
              { label: "Scope", value: "Grouped agents" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <SwarmsPageClient />
        </div>
      }
    />
  );
}
