"use client";

import { DesktopRouteBoundary } from "@/components/desktop/DesktopRouteBoundary";
import { OpenclawSetupSurface } from "@/components/dashboard/control/OpenclawSetupSurface";

export function DesktopControlDeck() {
  return <DesktopRouteBoundary routeKey="control" browserView={<OpenclawSetupSurface />} />;
}
