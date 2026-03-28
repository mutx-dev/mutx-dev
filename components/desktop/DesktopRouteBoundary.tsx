"use client";

import type { ReactNode } from "react";

import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { BrowserDashboardRedirect } from "@/components/desktop/BrowserDashboardRedirect";
import {
  DESKTOP_ROUTE_META,
  getDesktopRouteKeyForPath,
  type DesktopRouteKey,
} from "@/components/desktop/desktopRouteConfig";
import { DesktopNativeRoutePage } from "@/components/desktop/DesktopNativeRoutePage";
import { useDesktopStatus } from "@/components/desktop/useDesktopStatus";
import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";
import { DesktopSettingsWindow } from "@/components/desktop/DesktopSettingsWindow";

export function DesktopRouteBoundary({
  routeKey,
  browserView,
  browserRedirectTo,
}: {
  routeKey: DesktopRouteKey;
  browserView?: ReactNode;
  browserRedirectTo?: string;
}) {
  const meta = DESKTOP_ROUTE_META[routeKey];
  const { isDesktop, platformReady } = useDesktopStatus();
  const { currentWindow, ready } = useDesktopWindow();

  if (!platformReady) {
    return (
      <div className="space-y-4">
        <RouteHeader
          title={meta.title}
          description="Resolving the correct dashboard surface for this operator session."
          icon={meta.icon}
          iconTone={meta.iconTone}
          badge="shell bootstrap"
          stats={[
            { label: "Surface", value: "Resolving" },
            { label: "Bridge", value: "Initializing", tone: "warning" },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isDesktop && ready) {
    const effectiveRouteKey =
      currentWindow.currentRole === "settings"
        ? "control"
        : getDesktopRouteKeyForPath(currentWindow.currentWindow.route);

    if (currentWindow.currentRole === "settings" && effectiveRouteKey === "control") {
      return <DesktopSettingsWindow />;
    }
    return <DesktopNativeRoutePage routeKey={effectiveRouteKey} />;
  }

  if (browserRedirectTo) {
    return <BrowserDashboardRedirect href={browserRedirectTo} />;
  }

  return <>{browserView ?? null}</>;
}
