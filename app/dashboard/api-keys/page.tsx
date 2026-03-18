"use client";

import { KeyRound } from "lucide-react";

import { ApiKeysPageClient } from "@/components/app/ApiKeysPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardApiKeysPage() {
  return (
    <div className="space-y-6">
      <RouteHeader
        title="API Keys"
        description="Issue, rotate, and revoke API credentials used by external systems integrating with MUTX."
        icon={KeyRound}
        iconTone="text-amber-400 bg-amber-400/10"
        badge="security surface"
        stats={[
          { label: "Scope", value: "Credential mgmt" },
          { label: "Exposure", value: "Secret-aware", tone: "warning" },
        ]}
      />

      <ApiKeysPageClient />
    </div>
  );
}
