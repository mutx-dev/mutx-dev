"use client";

import { DashboardSectionPage } from "@/components/dashboard/DashboardSectionPage";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardChannelsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="channels"
      browserView={
        <DashboardSectionPage
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Channels" },
          ]}
          title="Channels"
          description="Assistant channel shell for bindings, policy mode, and safe communication defaults."
          badge="assistant channels"
          checks={[
            "Bind this route to mounted assistant channel state once browser panels consume the control-plane contract.",
            "Keep channel enablement and policy views grounded in real backend data.",
            "Use this surface for truthful channel inspection before introducing richer write flows.",
          ]}
        />
      }
    />
  );
}
