"use client";

import { Bot } from "lucide-react";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardAgentsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="agents"
      browserView={
        <ErrorBoundary>
          <div className="space-y-4">
            <RouteHeader
              title="Agents"
              description="Manage your MUTX agent registry, lifecycle operations, and per-agent configuration."
              icon={Bot}
              badge="core surface"
              stats={[
                { label: "Scope", value: "Fleet registry" },
                { label: "Data", value: "Live API", tone: "success" },
              ]}
            />

            <ErrorBoundary>
              <AgentsPageClient />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      }
    />
  );
}
