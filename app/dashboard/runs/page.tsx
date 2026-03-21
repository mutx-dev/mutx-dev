import { History } from "lucide-react";

import { RunsPageClient } from "@/components/dashboard/RunsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardRunsPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Runs"
        description="Recent execution history, terminal state, and operator recovery context from the live runs contract."
        icon={History}
        iconTone="text-cyan-300 bg-cyan-400/10"
        badge="execution surface"
        stats={[
          { label: "Scope", value: "Recent runs" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <RunsPageClient />
    </div>
  );
}
