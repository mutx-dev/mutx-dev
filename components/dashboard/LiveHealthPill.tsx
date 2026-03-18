"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LiveHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

interface HealthPayload {
  status?: string;
  error?: string | null;
  timestamp?: string;
}

interface LiveHealthPillState {
  status: LiveHealthStatus;
  error?: string;
  timestamp?: string;
  loading: boolean;
}

interface LiveHealthPillProps {
  className?: string;
}

const HEALTH_POLL_INTERVAL_MS = 20_000;
const HEALTH_REQUEST_TIMEOUT_MS = 3_500;

const HEALTH_TONE_CLASSNAMES: Record<LiveHealthStatus, string> = {
  healthy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  degraded: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  unhealthy: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  unknown: "border-slate-400/30 bg-slate-400/10 text-slate-200",
};

const HEALTH_DOT_CLASSNAMES: Record<LiveHealthStatus, string> = {
  healthy: "bg-emerald-300",
  degraded: "bg-amber-300",
  unhealthy: "bg-rose-300",
  unknown: "bg-slate-300",
};

function normalizeHealthStatus(status: unknown): LiveHealthStatus {
  if (typeof status !== "string") return "unknown";

  const normalized = status.toLowerCase();
  if (normalized === "healthy") return "healthy";
  if (normalized === "degraded") return "degraded";
  if (normalized === "unhealthy") return "unhealthy";
  return "unknown";
}

export function LiveHealthPill({ className }: LiveHealthPillProps) {
  const [state, setState] = useState<LiveHealthPillState>({
    status: "unknown",
    loading: true,
  });
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    const pollHealth = async () => {
      if (!mounted || inFlightRef.current) return;

      inFlightRef.current = true;
      setState((current) => ({ ...current, loading: true }));

      const controller = new AbortController();
      controllerRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch("/api/dashboard/health", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as HealthPayload;
        if (!mounted) return;

        setState({
          status: normalizeHealthStatus(payload.status),
          error: typeof payload.error === "string" ? payload.error : undefined,
          timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
          loading: false,
        });
      } catch (error) {
        if (!mounted) return;

        if (error instanceof DOMException && error.name === "AbortError") {
          setState({
            status: "degraded",
            error: "Health request timed out",
            timestamp: undefined,
            loading: false,
          });
        } else {
          setState({
            status: "unknown",
            error: error instanceof Error ? error.message : "Health request failed",
            timestamp: undefined,
            loading: false,
          });
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        inFlightRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void pollHealth();
      }
    };

    void pollHealth();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void pollHealth();
    }, HEALTH_POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      mounted = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      inFlightRef.current = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  const label = state.loading && !state.timestamp ? "API checking" : `API ${state.status}`;

  const title = useMemo(() => {
    const details: string[] = [];

    if (state.error) {
      details.push(state.error);
    }

    if (state.timestamp) {
      const parsed = new Date(state.timestamp).getTime();
      if (!Number.isNaN(parsed)) {
        details.push(`Last update ${new Date(parsed).toLocaleTimeString()}`);
      }
    }

    return details.length > 0 ? details.join(" · ") : "Live control plane health";
  }, [state.error, state.timestamp]);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        HEALTH_TONE_CLASSNAMES[state.status],
        className,
      )}
      title={title}
      aria-live="polite"
    >
      {state.loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <span
          aria-hidden
          className={cn("h-2 w-2 rounded-full", HEALTH_DOT_CLASSNAMES[state.status])}
        />
      )}

      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{state.status}</span>
    </div>
  );
}
