import { ShieldCheck } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { SecurityPageClient } from "@/components/dashboard/SecurityPageClient";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardSecurityPage() {
  return (
    <DesktopRouteBoundary
      routeKey="security"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Security"
            description="Credential inventory, auth posture, and trust boundaries in the same surface as deployment and recovery."
            icon={ShieldCheck}
            iconTone="text-amber-300 bg-amber-400/10"
            badge="security surface"
            stats={[
              { label: "Scope", value: "Auth + keys" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <SecurityPageClient />
        </div>
      }
    />
  );
}
