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
  formatCurrency,
  formatRelativeTime,
} from "@/components/dashboard/livePrimitives";

import type { components } from "@/app/types/api";

type Budget = components["schemas"]["BudgetResponse"];
type UsageBreakdown = components["schemas"]["UsageBreakdownResponse"];
type AnalyticsSummary = components["schemas"]["AnalyticsSummaryResponse"];
type UsageEvent = components["schemas"]["UsageEventResponse"];
type UsageEventList = components["schemas"]["UsageEventListResponse"];

export function BudgetsPageClient() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [usage, setUsage] = useState<UsageBreakdown | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const [budgetResponse, usageResponse, summaryResponse, eventsResponse] = await Promise.all([
          readJson<Budget>("/api/dashboard/budgets"),
          readJson<UsageBreakdown>("/api/dashboard/budgets/usage?period_start=30d"),
          readJson<AnalyticsSummary>("/api/dashboard/analytics/summary?period_start=30d"),
          readJson<UsageEventList>("/api/dashboard/usage/events?limit=12"),
        ]);

        if (!cancelled) {
          setBudget(budgetResponse);
          setUsage(usageResponse);
          setSummary(summaryResponse);
          setEvents(eventsResponse.items ?? []);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError instanceof ApiRequestError &&
            (loadError.status === 401 || loadError.status === 403)
          ) {
            setAuthRequired(true);
          } else {
            setError(loadError instanceof Error ? loadError.message : "Failed to load budgets");
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

  const topAgents = useMemo(() => usage?.usage_by_agent.slice(0, 4) ?? [], [usage]);
  const topEventTypes = useMemo(() => usage?.usage_by_type.slice(0, 4) ?? [], [usage]);

  if (loading) return <LiveLoading title="Budgets" />;
  if (authRequired) {
    return (
      <LiveAuthRequired
        title="Operator session required"
        message="Sign in to inspect credit posture, usage breakdowns, and operator cost trends."
      />
    );
  }
  if (error) return <LiveErrorState title="Budget surface unavailable" message={error} />;
  if (!budget || !usage) {
    return (
      <LiveEmptyState
        title="No budget data returned"
        message="The budget route responded without the expected payload."
      />
    );
  }

  return (
    <div className="space-y-4">
      <LiveKpiGrid>
        <LiveStatCard
          label="Credits remaining"
          value={formatCurrency(budget.credits_remaining)}
          detail={`${budget.plan} plan with reset on ${new Date(budget.reset_date).toLocaleDateString()}.`}
          status={asDashboardStatus(budget.usage_percentage >= 80 ? "warning" : "healthy")}
        />
        <LiveStatCard
          label="Credits used"
          value={formatCurrency(budget.credits_used)}
          detail={`${budget.usage_percentage}% of the current envelope has been consumed.`}
        />
        <LiveStatCard
          label="API calls"
          value={String(summary?.total_api_calls ?? 0)}
          detail={`${summary?.total_runs ?? 0} runs across ${summary?.total_agents ?? 0} agents in the current period.`}
        />
        <LiveStatCard
          label="Latency"
          value={`${summary?.avg_latency_ms ?? 0}ms`}
          detail="Average latency reported by analytics over the selected window."
          status={asDashboardStatus((summary?.avg_latency_ms ?? 0) > 500 ? "warning" : "healthy")}
        />
      </LiveKpiGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-4">
          <LivePanel title="Usage by agent" meta={`${usage.usage_by_agent.length} agents`}>
            {topAgents.length === 0 ? (
              <LiveEmptyState
                title="No billable agent usage yet"
                message="Usage breakdown will land here once MUTX has tracked events for your fleet."
              />
            ) : (
              <div className="space-y-3">
                {topAgents.map((agent) => (
                  <div key={agent.agent_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{agent.agent_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{agent.event_count} tracked events</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatCurrency(agent.credits_used)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>

          <LivePanel title="Usage events" meta={`${events.length} rows`}>
            {events.length === 0 ? (
              <LiveEmptyState
                title="No usage events returned"
                message="Tracked operator usage will appear here once the usage event stream is active."
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{event.event_type}</p>
                        <p className="mt-1 text-xs text-slate-500">{event.resource_id || "no resource id"}</p>
                      </div>
                      <p className="text-sm text-slate-300">{formatRelativeTime(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LivePanel>
        </div>

        <LivePanel title="Spend mix" meta={`${usage.usage_by_type.length} event types`}>
          {topEventTypes.length === 0 ? (
            <LiveEmptyState
              title="No spend mix yet"
              message="Once usage events exist, spend by event type will be broken down here."
            />
          ) : (
            <div className="space-y-3">
              {topEventTypes.map((item) => (
                <div key={item.event_type} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.event_type}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.event_count} tracked events</p>
                    </div>
                    <p className="text-sm font-semibold text-white">{formatCurrency(item.credits_used)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LivePanel>
      </div>
    </div>
  );
}
