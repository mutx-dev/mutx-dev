import { LayoutGrid } from "lucide-react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { TemplateCatalogPageClient } from "@/components/dashboard/TemplateCatalogPageClient";

export default function DashboardTemplatesPage() {
  return (
    <div className="space-y-4">
      <RouteHeader
        title="Templates"
        description="Browse, clone, and deploy MUTX agent starter templates. Custom templates are editable and persisted to your catalog."
        icon={LayoutGrid}
        iconTone="text-violet-300 bg-violet-400/10"
        badge="workspace"
        stats={[
          { label: "Scope", value: "Templates + custom" },
          { label: "Source", value: "API + local catalog" },
        ]}
      />

      <TemplateCatalogPageClient />
    </div>
  );
}
