"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, ShieldAlert, Webhook } from "lucide-react";

import { ApiRequestError, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LiveMiniStat,
  LiveMiniStatGrid,
  LivePanel,
  LiveStatCard,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

type DashboardStatus = "idle" | "running" | "success" | "warning" | "error";

type NotificationItem = {
  id: string;
  kind: "alert" | "approval" | "webhook" | "governance" | "runtime";
  title: string;
  detail: string;
  status: DashboardStatus;
  createdAt: string | null;
  source: string;
  href: string | null;
  meta: string | null;
};

type NotificationsPayload = {
  generatedAt: string;
  summary: {
    alerts: number;
    approvals: number;
    webhookFailures: number;
    runtimeIncidents: number;
    governancePendingApprovals: number | null;
  };
  items: NotificationItem[];
  partials: string[];
};

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

export function NotificationsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<NotificationsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setError(null);

      try {
        const response = await readJson<NotificationsPayload>("/api/dashboard/notifications");
        if (!cancelled) {
          setPayload(response);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (isAuthError(loadError)) {
            setAuthRequired(true);
          } else {
            setError(
              loadError instanceof Error ? loadError.message : "Failed to load notifications",
            );
          }
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const items = payload?.items ?? [];
    return {
      alerts: items.filter((item) => item.kind === "alert").length,
      approvals: items.filter((item) => item.kind === "approval").length,
      runtime: items.filter((item) => item.kind === "runtime").length,
      governance: items.filter((item) => item.kind === "governance").length,
      webhooks: items.filter((item) => item.kind === "webhook").length,
    };
  }, [payload]);

  if (loading) return <LiveLoading title="Notifications" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect alerts, approvals, webhook failures, and runtime incidents."
      />
    );
  }
  if (error) return <LiveErrorState title="Notification feed unavailable" message={error} />;
  if (!payload) {
    return (
      <LiveErrorState
        title="Notification feed unavailable"
        message="No notification payload was returned by the dashboard proxy."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Alerts"
          value={String(payload.summary.alerts)}
          detail="Open monitoring alerts sampled into the operator inbox."
          status={payload.summary.alerts > 0 ? "error" : "success"}
        />
        <LiveStatCard
          label="Approvals"
          value={String(payload.summary.approvals)}
          detail="Pending approval requests still waiting on an operator decision."
          status={payload.summary.approvals > 0 ? "warning" : "success"}
        />
        <LiveStatCard
          label="Webhook failures"
          value={String(payload.summary.webhookFailures)}
          detail="Recent failing delivery attempts across active webhook routes."
          status={payload.summary.webhookFailures > 0 ? "error" : "success"}
        />
        <LiveStatCard
          label="Runtime incidents"
          value={String(payload.summary.runtimeIncidents)}
          detail="Supervised runtime incidents surfaced by the governance layer when available."
          status={payload.summary.runtimeIncidents > 0 ? "error" : "idle"}
        />
        <LiveStatCard
          label="Governance pending"
          value={
            payload.summary.governancePendingApprovals === null
              ? "partial"
              : String(payload.summary.governancePendingApprovals)
          }
          detail="Decision-by-decision governance events are not exposed yet, so this route shows runtime status summaries."
          status={
            payload.summary.governancePendingApprovals && payload.summary.governancePendingApprovals > 0
              ? "warning"
              : payload.summary.governancePendingApprovals === null
                ? "idle"
                : "success"
          }
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <LivePanel title="Operator inbox" meta={`${payload.items.length} signals`}>
          {payload.items.length === 0 ? (
            <LiveEmptyState
              title="Inbox is clear"
              message="No alert, approval, webhook, or runtime signals are demanding operator attention right now."
            />
          ) : (
            <div className="space-y-3">
              {payload.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    </div>
                    <StatusBadge status={item.status} label={item.kind} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{item.source}</span>
                    {item.meta ? <span>· {item.meta}</span> : null}
                    {item.createdAt ? <span>· {formatRelativeTime(item.createdAt)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LivePanel>

        <div className="space-y-4">
          <LivePanel title="Coverage" meta="read-only">
            <LiveMiniStatGrid columns={2}>
              <LiveMiniStat
                label="Monitoring"
                value={String(counts.alerts)}
                detail="Alert items sampled from the monitoring contract."
                icon={ShieldAlert}
              />
              <LiveMiniStat
                label="Approvals"
                value={String(counts.approvals)}
                detail="Visible approval requests currently in PENDING state."
              />
              <LiveMiniStat
                label="Runtime"
                value={String(counts.runtime + counts.governance)}
                detail="Governance runtime and supervision summaries when the operator can see them."
                icon={BellRing}
              />
              <LiveMiniStat
                label="Webhooks"
                value={String(counts.webhooks)}
                detail="Failing delivery samples across active webhook routes."
                icon={Webhook}
              />
            </LiveMiniStatGrid>
          </LivePanel>

          <LivePanel title="Coverage notes" meta={`${payload.partials.length} notes`}>
            {payload.partials.length === 0 ? (
              <LiveEmptyState
                title="Full feed coverage"
                message="All notification sources returned a complete payload for this operator session."
              />
            ) : (
              <div className="space-y-3">
                {payload.partials.map((note) => (
                  <div
                    key={note}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-sm leading-6 text-slate-300">{note}</p>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>
        </div>
      </div>
    </div>
  );
}
