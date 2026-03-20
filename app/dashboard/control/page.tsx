import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";

export default function DashboardControlPage() {
  return (
    <DashboardSectionPage
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Setup" },
      ]}
      title="Setup"
      description="Assistant-first onboarding shell for starter deployment, operator auth, and initial control-plane readiness."
      badge="starter setup"
      checks={[
        "Drive the first-run flow from the same `personal_assistant` template and starter deployment route used by the CLI.",
        "Expose only real setup and readiness checks that map to mounted backend routes.",
        "Keep setup focused on authentication, starter deployment, and truthful follow-on actions.",
      ]}
    />
  );
}
