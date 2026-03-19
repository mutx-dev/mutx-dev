import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardRunsPage() {
  return (
    <DashboardSectionPage
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Runs" },
      ]}
      title="Runs"
      description="Execution timeline surface for operator-visible run history and status."
      badge="operator execution"
      checks={[
        "Bind this route to a truthful MUTX runs endpoint before rendering run rows, durations, or status chips.",
        "Reuse the same run identifiers and statuses exposed by backend APIs so operators can deep-link into deployment and trace context.",
        "Add server-driven filtering (status/agent/date) after backend contracts exist, instead of shipping synthetic run data.",
      ]}
    />
  );
}
