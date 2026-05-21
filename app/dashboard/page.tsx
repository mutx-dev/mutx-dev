"use client";

import { Activity } from "lucide-react";

import { DashboardOverviewPageClient } from "@/components/dashboard/DashboardOverviewPageClient";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardPage() {
  return (
    <DesktopRouteBoundary
      routeKey="home"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Overview"
            description="Fleet posture, recent execution, alerts, delivery health, and budget state in one surface."
            icon={Activity}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="workspace overview"
            stats={[
              { label: "Route", value: "/dashboard" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <DashboardOverviewPageClient />
        </div>
      }
    />
  );
}
