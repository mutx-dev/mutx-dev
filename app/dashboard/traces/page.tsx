import { Workflow } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { TracesPageClient } from "@/components/dashboard/TracesPageClient";

export default function DashboardTracesPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Traces"
        description="Correlated event streams anchored to real runs instead of a standalone synthetic log wall."
        icon={Workflow}
        iconTone="text-sky-300 bg-sky-400/10"
        badge="trace explorer"
        stats={[
          { label: "Scope", value: "Run drilldown" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <TracesPageClient />
    </div>
  );
}
