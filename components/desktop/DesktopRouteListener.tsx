"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDesktopWindow } from "@/components/desktop/useDesktopWindow";
import type { DesktopWindowPayload } from "@/components/desktop/types";

const WINDOW_QUERY_KEYS: Array<keyof DesktopWindowPayload> = [
  "pane",
  "tab",
  "agentId",
  "deploymentId",
  "runId",
  "sessionId",
];

export function DesktopRouteListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { updateCurrentWindow } = useDesktopWindow();

  useEffect(() => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop) {
      return;
    }

    const unsubscribe = window.mutxDesktop.onNavigate((route) => {
      if (typeof route === "string" && route.startsWith("/")) {
        router.push(route);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.mutxDesktop?.isDesktop || !pathname) {
      return;
    }

    const payload: DesktopWindowPayload = {};
    for (const key of WINDOW_QUERY_KEYS) {
      const value = searchParams?.get(key);
      if (value) {
        payload[key] = value;
      }
    }

    void updateCurrentWindow({
      route: pathname,
      payload,
    });
  }, [pathname, searchParams, updateCurrentWindow]);

  return null;
}
