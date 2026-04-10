"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { buildPicoPath } from "@/lib/pico/routing";

type SectionResult = {
  key: string;
  ok: boolean;
  status: number;
  payload: unknown;
  error: string | null;
};

const endpoints = [
  ["assistant", "/api/dashboard/assistant/overview"],
  ["runs", "/api/dashboard/runs"],
  ["alerts", "/api/dashboard/monitoring/alerts"],
  ["budget", "/api/dashboard/budgets"],
  ["usage", "/api/dashboard/budgets/usage?period_start=30d"],
  ["runtime", "/api/dashboard/runtime/providers/openclaw"],
  ["approvals", "/api/dashboard/approvals?status=PENDING"],
  ["health", "/api/dashboard/health"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractError(payload: unknown, fallback: string) {
  if (typeof payload === "string") return payload;
  if (isRecord(payload)) {
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.message === "string") return payload.message;
    if (isRecord(payload.error) && typeof payload.error.message === "string") {
      return payload.error.message;
    }
  }
  return fallback;
}

function SectionCard({ title, section, children }: { title: string; section?: SectionResult; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {section ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${section.ok ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : section.status === 401 ? "border border-amber-300/20 bg-amber-300/10 text-amber-200" : "border border-rose-300/20 bg-rose-300/10 text-rose-200"}`}>
            {section.ok ? "Live" : section.status === 401 ? "Auth" : `Error ${section.status}`}
          </span>
        ) : null}
      </div>
      <div className="mt-4 text-sm leading-7 text-white/68">{children}</div>
      {section && !section.ok ? <p className="mt-4 text-sm text-amber-200">{section.error}</p> : null}
    </div>
  );
}

export function PicoControlPage() {
  const basePath = usePicoBasePath();
  const loginHref = buildPicoPath(basePath, "/login");
  const [sections, setSections] = useState<Record<string, SectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const responses = await Promise.all(
      endpoints.map(async ([key, url]) => {
        const response = await fetch(url, { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        return [
          key,
          {
            key,
            ok: response.ok,
            status: response.status,
            payload,
            error: response.ok ? null : extractError(payload, `Failed to load ${key}`),
          } satisfies SectionResult,
        ] as const;
      }),
    );

    setSections(Object.fromEntries(responses));
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const authRequired = useMemo(() => {
    const values = Object.values(sections);
    return values.length > 0 && values.every((section) => section.status === 401);
  }, [sections]);

  const assistant = sections.assistant?.payload as Record<string, unknown> | undefined;
  const assistantRuntime = isRecord(assistant) && isRecord(assistant.assistant) ? assistant.assistant : null;
  const runs = isRecord(sections.runs?.payload) && Array.isArray(sections.runs.payload.items) ? sections.runs.payload.items : [];
  const alerts = isRecord(sections.alerts?.payload) && Array.isArray(sections.alerts.payload.items) ? sections.alerts.payload.items : [];
  const approvals = Array.isArray(sections.approvals?.payload) ? sections.approvals.payload : [];
  const budget = isRecord(sections.budget?.payload) ? sections.budget.payload : null;
  const usage = isRecord(sections.usage?.payload) ? sections.usage.payload : null;
  const runtime = isRecord(sections.runtime?.payload) ? sections.runtime.payload : null;
  const health = isRecord(sections.health?.payload) ? sections.health.payload : null;

  return (
    <PicoProductShell
      title="Control"
      description="This page surfaces live assistant, run, alert, budget, runtime, health, and approval data from the same-origin API proxies already available in the product."
      actions={
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh live data
        </button>
      }
    >
      {authRequired ? (
        <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.08] p-6 text-sm leading-7 text-amber-50">
          Sign in first. These panels read authenticated same-origin APIs and stay honest when the session is missing.
          <div className="mt-4">
            <Link href={loginHref} className="font-semibold text-white">Go to sign in</Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/50">
        {lastUpdated ? `Last refreshed ${new Date(lastUpdated).toLocaleString()}.` : "Loading live control data..."}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Assistant overview" section={sections.assistant}>
          {assistantRuntime ? (
            <div className="space-y-2">
              <p>Name: {String(assistantRuntime.name ?? "Unnamed assistant")}</p>
              <p>Status: {String(assistantRuntime.status ?? "unknown")}</p>
              <p>Sessions: {String(assistantRuntime.session_count ?? 0)}</p>
              <p>Gateway: {isRecord(assistantRuntime.gateway) ? String(assistantRuntime.gateway.status ?? "unknown") : "unknown"}</p>
              <p>Skills: {Array.isArray(assistantRuntime.installed_skills) ? assistantRuntime.installed_skills.length : 0}</p>
              <p>Channels: {Array.isArray(assistantRuntime.channels) ? assistantRuntime.channels.length : 0}</p>
            </div>
          ) : (
            <p>No assistant runtime is currently available for this operator session.</p>
          )}
        </SectionCard>

        <SectionCard title="Recent runs" section={sections.runs}>
          <p>Total visible runs: {isRecord(sections.runs?.payload) ? String(sections.runs.payload.total ?? runs.length) : runs.length}</p>
          <ul className="mt-3 space-y-2 text-white/60">
            {runs.slice(0, 4).map((run, index) => {
              const item = isRecord(run) ? run : {};
              return <li key={String(item.id ?? index)}>{String(item.status ?? "unknown")} · {String(item.started_at ?? item.created_at ?? "no timestamp")}</li>;
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Alerts" section={sections.alerts}>
          <p>Unresolved count: {isRecord(sections.alerts?.payload) ? String(sections.alerts.payload.unresolved_count ?? 0) : "0"}</p>
          <ul className="mt-3 space-y-2 text-white/60">
            {alerts.slice(0, 4).map((alert, index) => {
              const item = isRecord(alert) ? alert : {};
              return <li key={String(item.id ?? index)}>{String(item.type ?? "alert")} · {String(item.message ?? "No message")}</li>;
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Budget" section={sections.budget}>
          <p>Plan: {String(budget?.plan ?? "unknown")}</p>
          <p>Credits remaining: {String(budget?.credits_remaining ?? "0")} / {String(budget?.credits_total ?? "0")}</p>
          <p>Usage: {String(budget?.usage_percentage ?? "0")}%</p>
          <p className="mt-3 text-white/55">Top usage drivers:</p>
          <ul className="mt-2 space-y-2 text-white/60">
            {Array.isArray(usage?.usage_by_agent) ? usage.usage_by_agent.slice(0, 3).map((item, index) => {
              const agent = isRecord(item) ? item : {};
              return <li key={String(agent.agent_id ?? index)}>{String(agent.agent_name ?? "Unknown agent")} · {String(agent.credits_used ?? 0)} credits</li>;
            }) : <li>No usage breakdown returned.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Runtime" section={sections.runtime}>
          <p>Provider: {String(runtime?.label ?? runtime?.provider ?? "openclaw")}</p>
          <p>Status: {String(runtime?.status ?? "unknown")}</p>
          <p>Version: {String(runtime?.version ?? "unknown")}</p>
          <p>Binding count: {String(runtime?.binding_count ?? 0)}</p>
          <p>Gateway URL: {String(runtime?.gateway_url ?? "not set")}</p>
        </SectionCard>

        <SectionCard title="Approvals" section={sections.approvals}>
          <p>Pending approvals returned: {approvals.length}</p>
          <ul className="mt-3 space-y-2 text-white/60">
            {approvals.slice(0, 4).map((approval, index) => {
              const item = isRecord(approval) ? approval : {};
              return <li key={String(item.id ?? index)}>{String(item.action_type ?? "unknown action")} · {String(item.requester ?? "unknown requester")} · {String(item.status ?? "PENDING")}</li>;
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Health" section={sections.health}>
          <p>Status: {String(health?.status ?? "unknown")}</p>
          <p>Database: {String(health?.database ?? "unknown")}</p>
          <p>Uptime seconds: {String(health?.uptime_seconds ?? 0)}</p>
        </SectionCard>
      </div>
    </PicoProductShell>
  );
}
