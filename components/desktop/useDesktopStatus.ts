"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { DesktopStatus } from "@/components/desktop/types";

const DEFAULT_STATUS: DesktopStatus = {
  mode: "unknown",
  apiUrl: null,
  apiHealth: "unknown",
  authenticated: false,
  user: null,
  openclaw: {
    binaryPath: null,
    health: "unknown",
    gatewayUrl: null,
  },
  faramesh: {
    available: false,
    socketPath: null,
    health: "unknown",
  },
  uiServer: {
    ready: false,
    state: "unknown",
    url: null,
    port: null,
    lastError: null,
    lastExitCode: null,
    attempt: 0,
  },
  localControlPlane: {
    ready: false,
    path: null,
    state: "unknown",
    exists: null,
    lastError: null,
  },
  runtime: {
    state: "unknown",
    lastError: null,
  },
  assistant: {
    found: false,
    name: null,
    agentId: null,
    workspace: null,
    gatewayStatus: null,
    sessionCount: 0,
    state: "unknown",
    lastError: null,
  },
  bridge: {
    ready: false,
    state: "unknown",
    pythonCommand: null,
    scriptPath: null,
    lastError: null,
    lastExitCode: null,
  },
  cliAvailable: false,
  mutxVersion: null,
  lastUpdated: null,
};

export interface DesktopStatusContextValue {
  status: DesktopStatus;
  loading: boolean;
  error: string | null;
  platformReady: boolean;
  refetch: () => Promise<void>;
  isDesktop: boolean;
}

const DesktopStatusContext = createContext<DesktopStatusContextValue | null>(null);

function readImmediateDesktopFlag() {
  return typeof window !== "undefined" && Boolean(window.mutxDesktop?.isDesktop);
}

function useDesktopStatusState(active: boolean): DesktopStatusContextValue {
  const [status, setStatus] = useState<DesktopStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(active);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [platformReady, setPlatformReady] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!active) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const desktopApi = window.mutxDesktop;
    const desktop = !!desktopApi?.isDesktop;
    setIsDesktop(desktop);
    setPlatformReady(true);

    if (!desktopApi?.isDesktop) {
      setLoading(false);
      return;
    }

    try {
      const desktopStatus = await desktopApi.getDesktopStatus();
      if (desktopStatus) {
        setStatus(desktopStatus as DesktopStatus);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch desktop status");
    } finally {
      setLoading(false);
    }
  }, [active]);

  const immediateDesktop = readImmediateDesktopFlag();
  const resolvedIsDesktop = isDesktop || immediateDesktop;
  const resolvedPlatformReady = platformReady || typeof window !== "undefined";

  useEffect(() => {
    if (!active) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const desktopApi = window.mutxDesktop;
    const desktop = !!desktopApi?.isDesktop;
    setIsDesktop(desktop);
    setPlatformReady(true);

    if (!desktopApi?.isDesktop) {
      setLoading(false);
      return;
    }

    fetchStatus();

    const unsubscribe = desktopApi.onDesktopStatusChanged((newStatus) => {
      setStatus(newStatus as DesktopStatus);
    });

    return () => {
      unsubscribe?.();
    };
  }, [active, fetchStatus]);

  return {
    status,
    loading: loading && resolvedIsDesktop,
    error,
    platformReady: resolvedPlatformReady,
    refetch: fetchStatus,
    isDesktop: resolvedIsDesktop,
  };
}

export function DesktopStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useDesktopStatusState(true);
  const memoizedValue = useMemo(
    () => value,
    [value.error, value.isDesktop, value.loading, value.platformReady, value.refetch, value.status],
  );

  return createElement(DesktopStatusContext.Provider, { value: memoizedValue }, children);
}

export function useDesktopStatus() {
  const context = useContext(DesktopStatusContext);
  const fallback = useDesktopStatusState(!context);

  return context ?? fallback;
}
