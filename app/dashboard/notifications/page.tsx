import { BellRing } from "lucide-react";

import { NotificationsPageClient } from "@/components/dashboard/NotificationsPageClient";
import { RouteHeader } from "@/components/dashboard/RouteHeader";

export default function DashboardNotificationsPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Notifications"
        description="A focused inbox for live alerts, pending approvals, webhook failures, and runtime incident summaries."
        icon={BellRing}
        iconTone="text-amber-300 bg-amber-400/10"
        badge="signal inbox"
        stats={[
          { label: "Scope", value: "Signals only" },
          { label: "Data", value: "Live API", tone: "success" },
        ]}
      />

      <NotificationsPageClient />
    </div>
  );
}
