"use client";

import { Layers } from "lucide-react";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DeploymentsPageClient } from "@/components/app/DeploymentsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardDeploymentsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="deployments"
      browserView={
        <ErrorBoundary>
          <div className="space-y-4">
            <RouteHeader
              title="Deployments"
              description="Operate active MUTX deployments, rollout actions, and runtime-level fleet posture."
              icon={Layers}
              iconTone="text-emerald-400 bg-emerald-400/10"
              badge="core surface"
              stats={[
                { label: "Scope", value: "Runtime control" },
                { label: "Data", value: "Live API", tone: "success" },
              ]}
            />

            <ErrorBoundary>
              <DeploymentsPageClient />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      }
    />
  );
}
