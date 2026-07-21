"use client";

import { MemoryStick } from "lucide-react";

import { MemoryPageClient } from "@/components/dashboard/MemoryPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardMemoryPage() {
  return (
    <DesktopRouteBoundary
      routeKey="memory"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Memory"
            description="Inspect retained session context, source activity, and workspace memory artifacts from the live contract."
            icon={MemoryStick}
            iconTone="text-violet-300 bg-violet-400/10"
            badge="memory surface"
            stats={[
              { label: "Scope", value: "Context + artifacts" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />
          <MemoryPageClient />
        </div>
      }
    />
  );
}
