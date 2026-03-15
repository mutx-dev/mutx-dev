import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardLogsPage() {
  return (
    <DashboardSectionPage
      title="Logs"
      description="Inspect structured runtime output, filter by lane/agent, and drill into failure traces."
      checks={[
        "Streaming log console",
        "Facet filters for source, severity, and lane",
        "Trace drilldown with correlation IDs",
      ]}
    />
  );
}
