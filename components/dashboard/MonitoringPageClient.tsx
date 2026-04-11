"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiRequestError, readJson } from "@/components/app/http";
import { FailureProgressCard } from "@/components/dashboard/FailureProgressCard";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
  formatDateTime,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { deriveAlertFailureGuidance } from "@/lib/dashboardFailureGuidance";

import type { components } from "@/app/types/api";

type Alert = components["schemas"]["AlertResponse"];
type AlertList = components["schemas"]["AlertListResponse"];

export function MonitoringPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const [alertsResult, healthResult] = await Promise.allSettled([
          readJson<AlertList>("/api/dashboard/monitoring/alerts?limit=16"),
          readJson<Record<string, unknown>>("/api/dashboard/health"),
        ]);

        if (cancelled) {
          return;
        }

        if (alertsResult.status === "rejected") {
          const loadError = alertsResult.reason;
          if (
            loadError instanceof ApiRequestError &&
            (loadError.status === 401 || loadError.status === 403)
          ) {
            setAuthRequired(true);
            setAlerts([]);
            setHealth(null);
            setLoading(false);
            return;
          }

          throw loadError;
        }

        setAlerts(alertsResult.value.items ?? []);
        setHealth(
          healthResult.status === "fulfilled"
            ? healthResult.value
            : {
                status: "degraded",
                database: "unknown",
              },
        );
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load monitoring");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);
  const unresolvedCount = unresolvedAlerts.length;
  const alertGuidance = unresolvedAlerts
    .map((alert) => ({ alert, guidance: deriveAlertFailureGuidance({ type: alert.type, message: alert.message }) }))
    .find((entry) => entry.guidance);
  const healthStatus = typeof health?.status === "string" ? health.status : "unknown";
  const databaseStatus = typeof health?.database === "string" ? health.database : "unknown";
  const timestamp = typeof health?.timestamp === "string" ? health.timestamp : null;

  if (loading) return <LiveLoading title="Monitoring" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect live health and alert state."
      />
    );
  }
  if (error) return <LiveErrorState title="Monitoring unavailable" message={error} />;

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="System status"
          value={healthStatus}
          detail={`Database ${databaseStatus}${timestamp ? ` · checked ${formatRelativeTime(timestamp)}` : ""}`}
          status={asDashboardStatus(healthStatus)}
        />
        <LiveStatCard
          label="Open alerts"
          value={String(unresolvedCount)}
          detail={`${alerts.length} total records returned by monitoring.`}
          status={asDashboardStatus(unresolvedCount > 0 ? "warning" : "healthy")}
        />
      </LiveKpiGrid>

      {alertGuidance?.guidance ? (
        <FailureProgressCard
          guidance={alertGuidance.guidance}
          signal={alertGuidance.alert.message}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <LivePanel title="Alert rail" meta={`${alerts.length} records`}>
          {alerts.length === 0 ? (
            <LiveEmptyState
              title="No open alerts"
              message="Quota, deployment, and runtime failures will appear here when triggered."
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const guidance = deriveAlertFailureGuidance({ type: alert.type, message: alert.message })

                return (
                  <div key={alert.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{alert.type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                      </div>
                      <StatusBadge
                        status={alert.resolved ? "success" : "warning"}
                        label={alert.resolved ? "resolved" : "open"}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{formatRelativeTime(alert.created_at)}</span>
                      <span>{formatDateTime(alert.created_at)}</span>
                      <span>agent {alert.agent_id.slice(0, 8)}</span>
                    </div>
                    {guidance ? (
                      <div className="mt-3 rounded-lg border border-sky-300/15 bg-sky-300/8 px-3 py-2">
                        <p className="text-xs text-sky-100">{guidance.stageNote}</p>
                        <Link href={guidance.primaryAction.href} className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-sky-200 hover:text-sky-100">
                          {guidance.primaryAction.label}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </LivePanel>

        <LivePanel title="Health snapshot" meta="control plane">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Status</span>
                <StatusBadge status={asDashboardStatus(healthStatus)} label={healthStatus} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Database</span>
                <StatusBadge status={asDashboardStatus(databaseStatus)} label={databaseStatus} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              Land here to assess whether an issue is deployment shape, auth posture, or runtime failure.
            </div>
          </div>
        </LivePanel>
      </div>
    </div>
  );
}
