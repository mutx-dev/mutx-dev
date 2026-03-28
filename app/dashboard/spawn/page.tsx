"use client";

import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";

export default function DashboardSpawnPage() {
  return <DesktopRouteBoundary routeKey="spawn" browserRedirectTo="/dashboard/agents?create=1" />;
}
