"use client";

import { MessagesSquare } from "lucide-react";

import { ChannelsPageClient } from "@/components/dashboard/ChannelsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardChannelsPage() {
  return (
    <DesktopRouteBoundary
      routeKey="channels"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Channels"
            description="Inspect assistant channel bindings, policy mode, sessions, and communication readiness from the live contract."
            icon={MessagesSquare}
            iconTone="text-cyan-300 bg-cyan-400/10"
            badge="assistant channels"
            stats={[
              { label: "Scope", value: "Bindings + sessions" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />
          <ChannelsPageClient />
        </div>
      }
    />
  );
}
