import { BarChart3 } from "lucide-react";

import { AnalyticsPageClient } from "@/components/dashboard/AnalyticsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardAnalyticsPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Analytics"
        description="Usage trends, latency posture, and operator activity summaries from the live analytics contracts."
        icon={BarChart3}
        iconTone="text-fuchsia-300 bg-fuchsia-400/10"
        badge="analytics surface"
        stats={[
          { label: "Scope", value: "Trends + usage" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <AnalyticsPageClient />
    </div>
  );
}
