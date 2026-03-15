import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardHistoryPage() {
  return (
    <DashboardSectionPage
      title="History"
      description="Review completed executions, compare run outcomes, and inspect historical context for regressions."
      checks={[
        "Execution timeline by lane",
        "Run diff and artifact snapshots",
        "Operator action audit trail",
      ]}
    />
  );
}
