"use client";

import { Bot } from "lucide-react";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { AgentsPageClient } from "@/components/app/AgentsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardAgentsPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
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

        <AgentsPageClient />
      </div>
    </ErrorBoundary>
  );
}
