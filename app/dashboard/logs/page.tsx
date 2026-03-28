"use client";

import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardLogsPage() {
  return <DesktopRouteBoundary routeKey="logs" browserRedirectTo="/dashboard/monitoring" />;
}
