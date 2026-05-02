import { Key } from "lucide-react";

import { ApiKeysPageClient } from "@/components/dashboard/ApiKeysPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardApiKeysPage() {
  return (
    <DesktopRouteBoundary
      routeKey="apiKeys"
      browserView={
        <div className="space-y-4">
          <RouteHeader
            title="API Keys"
            description="Create, rotate, revoke, and inspect API keys without leaving the dashboard."
            icon={Key}
            iconTone="text-amber-300 bg-amber-400/10"
            badge="credential surface"
            stats={[
              { label: "Scope", value: "Keys only" },
              { label: "Data", value: "Live API", tone: "success" },
            ]}
          />

          <ApiKeysPageClient />
        </div>
      }
    />
  );
}
