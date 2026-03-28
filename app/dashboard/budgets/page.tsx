import { Wallet } from "lucide-react";

import { BudgetsPageClient } from "@/components/dashboard/BudgetsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardBudgetsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="budgets"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Budgets"
            description="Credit posture, spend separation, and usage breakdown anchored to the live budget and analytics contracts."
            icon={Wallet}
            iconTone="text-emerald-300 bg-emerald-400/10"
            badge="cost surface"
            stats={[
              { label: "Scope", value: "Credits + usage" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <BudgetsPageClient />
        </div>
      }
    />
  );
}
