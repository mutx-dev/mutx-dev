import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardSessionsPage() {
  return (
    <DashboardSectionPage
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sessions" },
      ]}
      title="Sessions"
      description="Assistant session shell for channel-backed conversations, recent activity, and runtime handoff state."
      badge="assistant sessions"
      checks={[
        "Bind this route to `/v1/sessions` and assistant session detail once browser panels consume the mounted session contract.",
        "Surface only real channel, age, and token data that comes from the control plane.",
        "Keep session actions limited to supported runtime operations instead of synthetic browser controls.",
      ]}
    />
  );
}
