"use client";

import { DemoRoutePage } from "@/components/dashboard/DemoRoutePage";
import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardMemoryPage() {
  return (
    <DesktopRouteBoundary
      routeKey="memory"
      browserView={
        <DemoRoutePage
          title="Memory"
          description="Memory and context management need real retention and retrieval contracts before controls belong here."
          badge="demo memory"
          notes={[
            "Do not ship pretend vector-store or retention controls before the product semantics exist.",
            "This page should become the place to inspect memory pressure, retention windows, and context ownership.",
            "Until then, keep the route compact, honest, and visually aligned with the rest of the control plane.",
          ]}
        />
      }
    />
  );
}
