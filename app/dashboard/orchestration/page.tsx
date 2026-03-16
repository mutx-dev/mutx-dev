import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardOrchestrationPage() {
  return (
    <DashboardSectionPage
      title="Orchestration"
      description="Manage lane definitions, execution order, and handoff behavior across the agent graph."
      checks={[
        "Lane definition and dependency editor",
        "Handoff rules between agents",
        "Queue depth and concurrency controls",
      ]}
    />
  );
}
