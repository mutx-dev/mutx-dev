"use client";

import { Webhook } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import WebhooksPageClient from "@/components/webhooks/WebhooksPageClient";

export default function DashboardWebhooksPage() {
  return (
    <DesktopRouteBoundary
      routeKey="webhooks"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="Webhooks"
            description="Manage outbound event endpoints and verify delivery behavior with truthful delivery history."
            icon={Webhook}
            iconTone="text-purple-400 bg-purple-400/10"
            badge="integration surface"
            stats={[
              { label: "Scope", value: "Event delivery" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <WebhooksPageClient />
        </div>
      }
    />
  );
}
