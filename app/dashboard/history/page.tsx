"use client";

import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardHistoryPage() {
  return <DesktopRouteBoundary routeKey="history" browserRedirectTo="/dashboard/monitoring" />;
}
