import { Key } from "lucide-react";

import { ApiKeysPageClient } from "@/components/dashboard/ApiKeysPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardApiKeysPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="API Keys"
        description="Create, rotate, revoke, and inspect operator keys without leaving the dashboard shell."
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
  );
}
