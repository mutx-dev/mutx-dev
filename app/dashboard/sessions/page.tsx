import { Users } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { SessionsPageClient } from "@/components/dashboard/SessionsPageClient";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardSessionsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="sessions"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Sessions"
            description="Assistant sessions, channel presence, and OpenClaw gateway availability from the live session contracts."
            icon={Users}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="session surface"
            stats={[
              { label: "Scope", value: "Gateway sessions" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <SessionsPageClient />
        </div>
      }
    />
  );
}
