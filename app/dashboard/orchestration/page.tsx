"use client";

import { Network } from "lucide-react";

import { OrchestrationPageClient } from "@/components/dashboard/OrchestrationPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardOrchestrationPage() {
  return (
    <DesktopRouteBoundary
      routeKey="orchestration"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Orchestration"
            description="Inspect approvals, recovery lanes, blueprints, and autonomy queue posture from live orchestration data."
            icon={Network}
            iconTone="text-sky-300 bg-sky-400/10"
            badge="orchestration surface"
            stats={[
              { label: "Scope", value: "Workflow + recovery" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />
          <OrchestrationPageClient />
        </div>
      }
    />
  );
}
