import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardMonitoringPage() {
  return (
    <DashboardSectionPage
      title="Monitoring"
      description="Track health, throughput, and usage trends across agents and deployments in real time."
      checks={[
        "Live fleet health widgets",
        "Token, request, and cost usage breakdown",
        "Service-level error and latency trends",
      ]}
    />
  );
}
