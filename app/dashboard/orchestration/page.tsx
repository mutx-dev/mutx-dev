import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardOrchestrationPage() {
  return (
    <DashboardSectionPage
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Orchestration" },
      ]}
      title="Orchestration"
      description="Automation shell for workflows, wakeups, and follow-on control-plane routines after the starter assistant is live."
      badge="automation lanes"
      checks={[
        "Connect lane cards and dependency graph to real automation entities once MUTX publishes workflow and wakeup APIs.",
        "Expose pause/resume and concurrency controls only when actions map to backend mutations with auditability.",
        "Keep this route focused on truthful automation state instead of simulated queues or synthetic handoff graphs.",
      ]}
    />
  );
}
