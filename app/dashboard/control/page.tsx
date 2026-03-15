import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardControlPage() {
  return (
    <DashboardSectionPage
      title="Control Plane"
      description="Coordinate fleet controls, policy toggles, and operator actions from a single command surface."
      checks={[
        "Global run-state controls",
        "Access policy and safety override panel",
        "Bulk actions for active agents",
      ]}
    />
  );
}
