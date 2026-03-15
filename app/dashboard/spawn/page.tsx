import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardSpawnPage() {
  return (
    <DashboardSectionPage
      title="Spawn"
      description="Provision new agents from templates, assign runtime policies, and launch lanes."
      checks={[
        "Template and capability picker",
        "Runtime profile and environment bindings",
        "Launch queue with spawn status tracking",
      ]}
    />
  );
}
