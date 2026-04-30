import { Activity } from "lucide-react";

import { StandupPageClient } from "@/components/dashboard/StandupPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardStandupPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Standup"
        description="Derived operator brief synthesized from current alerts, approvals, runs, webhook failures, and optional local autonomy backlog."
        icon={Activity}
        iconTone="text-cyan-300 bg-cyan-400/10"
        badge="derived brief"
        stats={[
          { label: "Scope", value: "Read-only synthesis" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <StandupPageClient />
    </div>
  );
}
