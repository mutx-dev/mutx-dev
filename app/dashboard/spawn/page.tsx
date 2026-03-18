import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardSpawnPage() {
  return (
    <DashboardSectionPage
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Spawn" },
      ]}
      title="Spawn"
      description="Operator entry point for creating new MUTX agents and runs."
      badge="ported operator section"
      checks={[
        "Map this surface to the real MUTX create-agent or run-launch flow instead of preserving OpenClaw-specific spawn affordances.",
        "Add validated form sections only after the target backend contract is settled for models, tools, and ownership boundaries.",
        "Keep this route shell ready for a truthful multi-step operator flow without shipping fake provisioning controls.",
      ]}
    />
  );
}
