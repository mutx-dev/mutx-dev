"use client";

import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardSkillsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="skills"
      browserView={
        <DashboardSectionPage
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Skills" },
          ]}
          title="Skills"
          description="Assistant skills shell for installed workspace capabilities, registry-backed discovery, and safe mutation paths."
          badge="assistant skills"
          checks={[
            "Bind skill listings and mutations to the mounted assistant and ClawHub routes.",
            "Show installed versus available skills from the same backend source the CLI uses.",
            "Avoid browser-only toggles that do not map to real workspace state.",
          ]}
        />
      }
    />
  );
}
