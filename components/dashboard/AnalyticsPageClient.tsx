"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiRequestError, readJson } from "@/components/app/http";
import {
  LiveAuthRequired,
  LiveEmptyState,
  LiveErrorState,
  LiveKpiGrid,
  LiveLoading,
  LivePanel,
  LiveStatCard,
  asDashboardStatus,
} from "@/components/dashboard/livePrimitives";

import type { components } from "@/app/types/api";

type AnalyticsSummary = components["schemas"]["AnalyticsSummaryResponse"];
type AnalyticsTimeSeries = components["schemas"]["AnalyticsTimeSeries"];
type AnalyticsTimeSeriesResponse = components["schemas"]["AnalyticsTimeSeriesResponse"];
type CostSummary = components["schemas"]["CostSummaryResponse"];

const ANALYTICS_WINDOW = "30d";
const ANALYTICS_INTERVAL = "day";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAuthError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function isAnalyticsSummary(value: unknown): value is AnalyticsSummary {
  return (
    isRecord(value) &&
    typeof value.total_agents === "number" &&
    typeof value.active_agents === "number" &&
    typeof value.total_deployments === "number" &&
    typeof value.active_deployments === "number" &&
    typeof value.total_runs === "number" &&
    typeof value.successful_runs === "number" &&
    typeof value.failed_runs === "number" &&
    typeof value.total_api_calls === "number" &&
    typeof value.avg_latency_ms === "number" &&
    typeof value.period_start === "string" &&
    typeof value.period_end === "string"
  );
}

function isAnalyticsTimeSeriesResponse(value: unknown): value is AnalyticsTimeSeriesResponse {
  return (
    isRecord(value) &&
    typeof value.metric === "string" &&
    typeof value.interval === "string" &&
    Array.isArray(value.data)
  );
}

function isCostSummary(value: unknown): value is CostSummary {
  return (
    isRecord(value) &&
    typeof value.total_credits_used === "number" &&
    typeof value.credits_remaining === "number" &&
    typeof value.credits_total === "number" &&
    isRecord(value.usage_by_event_type) &&
    isRecord(value.usage_by_agent)
  );
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatValue(value: number, kind: "count" | "latency") {
  if (kind === "latency") {
    return `${Math.round(value)}ms`;
  }

  return Math.round(value).toLocaleString();
}

function rankUsage(values: Record<string, number> | undefined) {
  return Object.entries(values ?? {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
}

function TrendStrip({
  title,
  description,
  data,
  kind,
}: {
  title: string;
  description: string;
  data: AnalyticsTimeSeries[];
  kind: "count" | "latency";
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        <p className="mt-3 text-xs text-slate-500">No trend samples returned for this metric yet.</p>
      </div>
    );
  }

  const samples = data.slice(-7);
  const peak = Math.max(...samples.map((point) => point.value), 1);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <div className="mt-4 space-y-3">
        {samples.map((point) => {
          const width = Math.max((point.value / peak) * 100, 6);

          return (
            <div key={`${title}-${point.timestamp}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{formatShortDate(point.timestamp)}</span>
                <span>{formatValue(point.value, kind)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05]">
                <div
                  className="h-2 rounded-full bg-cyan-400/80"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [runTrend, setRunTrend] = useState<AnalyticsTimeSeriesResponse | null>(null);
  const [latencyTrend, setLatencyTrend] = useState<AnalyticsTimeSeriesResponse | null>(null);
  const [costs, setCosts] = useState<CostSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAuthRequired(false);
      setError(null);

      try {
        await readJson<Record<string, unknown>>("/api/auth/me");

        const [summaryResult, runTrendResult, latencyTrendResult, costsResult] = await Promise.allSettled([
          readJson<unknown>(`/api/dashboard/analytics/summary?period_start=${ANALYTICS_WINDOW}`),
          readJson<unknown>(
            `/api/dashboard/analytics/timeseries?metric=runs&period_start=${ANALYTICS_WINDOW}&interval=${ANALYTICS_INTERVAL}`,
          ),
          readJson<unknown>(
            `/api/dashboard/analytics/timeseries?metric=latency&period_start=${ANALYTICS_WINDOW}&interval=${ANALYTICS_INTERVAL}`,
          ),
          readJson<unknown>(`/api/dashboard/analytics/costs?period_start=${ANALYTICS_WINDOW}`),
        ]);

        if (cancelled) return;

        if (summaryResult.status === "rejected") {
          throw summaryResult.reason;
        }

        if (!isAnalyticsSummary(summaryResult.value)) {
          throw new Error("Analytics summary payload did not match the expected contract.");
        }

        setSummary(summaryResult.value);
        setRunTrend(
          runTrendResult.status === "fulfilled" && isAnalyticsTimeSeriesResponse(runTrendResult.value)
            ? runTrendResult.value
            : null,
        );
        setLatencyTrend(
          latencyTrendResult.status === "fulfilled" && isAnalyticsTimeSeriesResponse(latencyTrendResult.value)
            ? latencyTrendResult.value
            : null,
        );
        setCosts(
          costsResult.status === "fulfilled" && isCostSummary(costsResult.value)
            ? costsResult.value
            : null,
        );
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;

        if (isAuthError(loadError)) {
          setAuthRequired(true);
        } else {
          setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
        }
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const successRate = useMemo(() => {
    if (!summary || summary.total_runs === 0) return 0;
    return Math.round((summary.successful_runs / summary.total_runs) * 100);
  }, [summary]);

  const eventMix = useMemo(
    () => rankUsage(costs?.usage_by_event_type as Record<string, number> | undefined),
    [costs],
  );
  const resourceMix = useMemo(
    () => rankUsage(costs?.usage_by_agent as Record<string, number> | undefined),
    [costs],
  );

  if (loading) return <LiveLoading title="Analytics" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect trend data, latency posture, and usage analytics."
      />
    );
  }
  if (error) return <LiveErrorState title="Analytics unavailable" message={error} />;
  if (!summary) {
    return (
      <LiveEmptyState
        title="No analytics summary returned"
        message="The analytics route responded without the expected summary payload."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Success rate"
          value={`${successRate}%`}
          detail={`${summary.successful_runs} successful runs vs ${summary.failed_runs} failed in the selected window.`}
          status={asDashboardStatus(summary.failed_runs > 0 ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="Active agents"
          value={`${summary.active_agents}/${summary.total_agents}`}
          detail={`${summary.active_deployments} active deployments across ${summary.total_deployments} total deployments.`}
          status={asDashboardStatus(summary.active_agents > 0 ? "healthy" : "idle")}
        />
        <LiveStatCard
          label="API calls"
          value={summary.total_api_calls.toLocaleString()}
          detail={`${summary.total_runs.toLocaleString()} runs were recorded in this period.`}
        />
        <LiveStatCard
          label="Avg latency"
          value={`${Math.round(summary.avg_latency_ms)}ms`}
          detail={
            costs
              ? `${Math.round(costs.total_credits_used).toLocaleString()} tracked credits across the same window.`
              : "Tracked credits were not returned for this window."
          }
          status={asDashboardStatus(summary.avg_latency_ms > 500 ? "warning" : "healthy")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-4">
          <LivePanel title="Trend lane" meta="30d window">
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendStrip
                title="Run volume"
                description="Daily run counts from the analytics timeseries endpoint."
                data={runTrend?.data ?? []}
                kind="count"
              />
              <TrendStrip
                title="Latency"
                description="Daily latency averages returned by analytics."
                data={latencyTrend?.data ?? []}
                kind="latency"
              />
            </div>
          </LivePanel>

          <LivePanel title="Analytics snapshot" meta="current period">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Period start",
                  value: formatShortDate(summary.period_start),
                },
                {
                  label: "Period end",
                  value: formatShortDate(summary.period_end),
                },
                {
                  label: "Total deployments",
                  value: summary.total_deployments.toLocaleString(),
                },
                {
                  label: "Failed runs",
                  value: summary.failed_runs.toLocaleString(),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </LivePanel>
        </div>

        <LivePanel title="Cost profile" meta={costs ? "analytics costs" : "optional data"}>
          {!costs ? (
            <LiveEmptyState
              title="No cost profile returned"
              message="The analytics costs route did not return tracked credit data for this period."
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Credit envelope
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {Math.round(costs.total_credits_used).toLocaleString()} used
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {Math.round(costs.credits_remaining).toLocaleString()} remaining out of{" "}
                  {Math.round(costs.credits_total).toLocaleString()} tracked credits.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    By event type
                  </p>
                  <div className="mt-2 space-y-2">
                    {eventMix.length === 0 ? (
                      <p className="text-sm text-slate-400">No event-type breakdown returned.</p>
                    ) : (
                      eventMix.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                          <span className="truncate text-sm text-white">{label}</span>
                          <span className="text-xs text-slate-400">{Math.round(value).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    By resource
                  </p>
                  <div className="mt-2 space-y-2">
                    {resourceMix.length === 0 ? (
                      <p className="text-sm text-slate-400">No resource breakdown returned.</p>
                    ) : (
                      resourceMix.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                          <span className="truncate font-mono text-xs text-white">{label}</span>
                          <span className="text-xs text-slate-400">{Math.round(value).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </LivePanel>
      </div>
    </div>
  );
}
