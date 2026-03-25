import { Activity } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { ObservabilityPageClient } from "@/components/dashboard/ObservabilityPageClient";

export default function DashboardObservabilityPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Observability"
        description="Agent run observability powered by the MUTX Observability Schema (based on agent-run)."
        icon={Activity}
        iconTone="text-emerald-300 bg-emerald-400/10"
        badge="observability surface"
        stats={[
          { label: "Schema", value: "MutxRun" },
          { label: "Source", value: "agent-run", tone: "success" },
        ]}
      />

      <ObservabilityPageClient />
    </div>
  );
}
