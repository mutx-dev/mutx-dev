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
            iconTone="text-[#ffb199] bg-[rgba(255,77,0,0.12)]"
            badge="workspace overview"
            stats={[
              { label: "Workspace", value: "Browser" },
              { label: "Data", value: "Sign-in gated" },
            ]}
          />

          <DashboardOverviewPageClient />
        </div>
      }
    />
  );
}
