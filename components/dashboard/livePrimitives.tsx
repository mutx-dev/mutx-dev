import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { dashboardTokens } from "@/components/dashboard/tokens";
import type { DashboardStatus } from "@/components/dashboard/types";

export function formatRelativeTime(value?: string | null) {
  if (!value) return "Not recorded";

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Invalid timestamp";

  const diffMs = then - Date.now();
  const minutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid timestamp";
  return parsed.toLocaleString();
}

export function formatCurrency(value?: number | null) {
  const safeValue = Number.isFinite(value ?? NaN) ? Number(value) : 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: safeValue < 100 ? 2 : 0,
  }).format(safeValue);
}

export function asDashboardStatus(value?: string | null): DashboardStatus {
  const normalized = (value ?? "").toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("success") ||
    normalized.includes("ready") ||
    normalized.includes("completed") ||
    normalized.includes("active")
  ) {
    return "success";
  }

  if (
    normalized.includes("running") ||
    normalized.includes("sync") ||
    normalized.includes("warm")
  ) {
    return "running";
  }

  if (
    normalized.includes("warn") ||
    normalized.includes("retry") ||
    normalized.includes("queued") ||
    normalized.includes("pending") ||
    normalized.includes("awaiting")
  ) {
    return "warning";
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("blocked") ||
    normalized.includes("denied")
  ) {
    return "error";
  }

  return "idle";
}

export function LivePanel({
  title,
  meta,
  action,
  className,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "dashboard-entry overflow-hidden rounded-xl border",
        className,
      )}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradient,
        boxShadow: dashboardTokens.shadowSm,
      }}
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-5 py-4"
        style={{
          borderColor: dashboardTokens.borderSubtle,
          backgroundColor: dashboardTokens.bgSurface,
        }}
      >
        <div className="min-w-0">
          <h2
            className="truncate text-[14px] font-medium tracking-[-0.01em]"
            style={{ color: dashboardTokens.textPrimary }}
          >
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {meta ? (
            <span
              className="hidden font-[family:var(--font-mono)] text-[9px] font-medium uppercase tracking-[0.16em] sm:inline"
              style={{ color: dashboardTokens.textLabel }}
            >
              {meta}
            </span>
          ) : null}
          {action}
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function LiveStatCard({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  status?: DashboardStatus;
}) {
  return (
    <article
      className="dashboard-entry rounded-lg border p-5"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradientStrong,
        boxShadow: dashboardTokens.shadowSm,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: dashboardTokens.textMuted }}>{label}</p>
          <p
            className="mt-3 truncate font-[family:var(--font-site-display)] text-[2.25rem] font-light leading-none tracking-[-0.065em]"
            style={{ color: dashboardTokens.textPrimary }}
          >
            {value}
          </p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <p className="mt-4 text-[12px] leading-5" style={{ color: dashboardTokens.textSubtle }}>
        {detail}
      </p>
    </article>
  );
}

export function LiveKpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function LiveMiniStatGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return <div className={cn("grid gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>{children}</div>;
}

export function LiveMiniStat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: LucideIcon;
}) {
  return (
    <div
          className="rounded-lg border p-4"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgInset,
      }}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: dashboardTokens.textMuted }}>
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: dashboardTokens.textPrimary }}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] leading-5" style={{ color: dashboardTokens.textMuted }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function LiveLoading({ title }: { title: string }) {
  return (
    <LivePanel title={title} meta="loading">
      <LoadingState variant="cards" count={3} />
    </LivePanel>
  );
}

export function LiveAuthRequired({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const displayTitle = title.replace(/^Operator session/i, "Sign-in");

  return (
    <LivePanel title={title} meta="auth required">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:items-center">
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
            style={{
              borderColor: dashboardTokens.borderStrong,
              backgroundColor: dashboardTokens.brandSoft,
              color: dashboardTokens.brand,
            }}
          >
            <Lock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-[family:var(--font-mono)] text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: dashboardTokens.textLabel }}>
              Private workspace
            </p>
            <p className="mt-2 font-[family:var(--font-site-display)] text-2xl font-light tracking-[-0.05em]" style={{ color: dashboardTokens.textPrimary }}>
              {displayTitle}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: dashboardTokens.textSubtle }}>
              {message}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/login?next=%2Fdashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#f04a00] px-4 text-xs font-semibold text-[#fffaf3] transition hover:bg-[#cf3f00]"
              >
                Sign in
              </Link>
              <Link
                href="/register?next=%2Fdashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#c9c3b6] bg-[#fbfaf6] px-4 text-xs font-semibold text-[#191916] transition hover:border-[#191916]"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <ul className="border-l border-[#d8d3c7] pl-5">
          {[
            "Fleet health and current deployment state.",
            "Recent runs, alerts, and budget pressure.",
            "The permissions attached to your account.",
          ].map((note, index) => (
            <li
              key={note}
              className="flex items-start gap-3 border-b border-[#e2ddd2] py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <span className="font-[family:var(--font-mono)] text-[9px] text-[#f04a00]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[13px] leading-5 text-[#625e57]">{note}</p>
            </li>
          ))}
        </ul>
      </div>
    </LivePanel>
  );
}

export function LiveErrorState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <EmptyState
      title={title}
      message={message}
      icon={<AlertTriangle className="h-7 w-7" />}
      className="py-16"
    />
  );
}

export function LiveEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <EmptyState
      title={title}
      message={message}
      icon={<Sparkles className="h-7 w-7" />}
      className="py-16"
    />
  );
}

export type BriefingBarStatus = "healthy" | "degraded" | "critical" | "unknown";

export type BriefingBarEntry = {
  label: string;
  value: string;
  status: BriefingBarStatus;
};

export function SignalPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "info";
}) {
  const toneClasses = {
    success: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    warning: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    info: "bg-sky-500/15 border-sky-500/30 text-sky-300",
  };

  return (
    <div className={`rounded-lg border px-2.5 py-1.5 ${toneClasses[tone]}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xs font-semibold font-mono truncate">{value}</div>
    </div>
  );
}

export function BriefingBar({ entries }: { entries: BriefingBarEntry[] }) {
  const statusDotClasses: Record<BriefingBarStatus, string> = {
    healthy: "bg-emerald-400",
    degraded: "bg-amber-400",
    critical: "bg-rose-400",
    unknown: "bg-slate-500",
  };

  const statusTextClasses: Record<BriefingBarStatus, string> = {
    healthy: "text-emerald-300",
    degraded: "text-amber-300",
    critical: "text-rose-300",
    unknown: "text-slate-400",
  };

  return (
    <div
      className="flex items-center gap-5 overflow-x-auto border-y px-1 py-3"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: "transparent",
      }}
    >
      {entries.map((entry, index) => (
        <div key={entry.label} className="flex items-center gap-2 shrink-0">
          {index > 0 && (
            <div
              className="h-4 w-px"
              style={{ backgroundColor: dashboardTokens.borderSubtle }}
            />
          )}
          <div className={`h-2 w-2 rounded-full ${statusDotClasses[entry.status]}`} />
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: dashboardTokens.textMuted }}
          >
            {entry.label}
          </span>
          <span className={`text-xs font-semibold ${statusTextClasses[entry.status]}`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export type RunFlowStatus = "pending" | "running" | "completed" | "failed" | "awaiting_owner";

export interface QueueDepthEntry {
  status: RunFlowStatus;
  count: number;
  label: string;
}

export interface FlowStage {
  status: RunFlowStatus;
  count: number;
  maxCount: number;
}

export function QueueDepthBar({ entries }: { entries: QueueDepthEntry[] }) {
  const statusConfig: Record<RunFlowStatus, { bar: string; text: string; dot: string }> = {
    pending: { bar: "bg-slate-500", text: "text-slate-400", dot: "bg-slate-400" },
    running: { bar: "bg-cyan-500", text: "text-cyan-300", dot: "bg-cyan-400" },
    completed: { bar: "bg-emerald-500", text: "text-emerald-300", dot: "bg-emerald-400" },
    failed: { bar: "bg-rose-500", text: "text-rose-300", dot: "bg-rose-400" },
    awaiting_owner: { bar: "bg-amber-500", text: "text-amber-300", dot: "bg-amber-400" },
  };

  const total = entries.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Queue depth</span>
        <span className="text-xs font-semibold text-white">{total} total</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[#1a2943]">
        {entries.map((entry) => {
          if (entry.count === 0) return null;
          const width = total > 0 ? (entry.count / total) * 100 : 0;
          return (
            <div
              key={entry.status}
              className={cn("h-full transition-all", statusConfig[entry.status].bar)}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig[entry.status].dot)} />
            <span className={cn("text-[10px]", statusConfig[entry.status].text)}>
              {entry.label}: {entry.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlowStatusBar({ stages }: { stages: FlowStage[] }) {
  const stageConfig: Record<RunFlowStatus, { active: string; pending: string; label: string; dot: string }> = {
    pending: {
      active: "border-slate-500/30 bg-slate-500/10 text-slate-400",
      pending: "border-slate-700/30 bg-[#0a1428] text-slate-600",
      label: "Pending",
      dot: "bg-slate-400",
    },
    running: {
      active: "border-cyan-500/50 bg-cyan-500/15 text-cyan-300",
      pending: "border-cyan-900/30 bg-[#0a1428] text-slate-600",
      label: "Running",
      dot: "bg-cyan-400",
    },
    completed: {
      active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
      pending: "border-emerald-900/30 bg-[#0a1428] text-slate-600",
      label: "Completed",
      dot: "bg-emerald-400",
    },
    failed: {
      active: "border-rose-500/50 bg-rose-500/15 text-rose-300",
      pending: "border-rose-900/30 bg-[#0a1428] text-slate-600",
      label: "Failed",
      dot: "bg-rose-400",
    },
    awaiting_owner: {
      active: "border-amber-500/50 bg-amber-500/15 text-amber-300",
      pending: "border-amber-900/30 bg-[#0a1428] text-slate-600",
      label: "Awaiting Owner",
      dot: "bg-amber-400",
    },
  };

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, index) => {
        const config = stageConfig[stage.status];
        const isActive = stage.count > 0;
        return (
          <div key={stage.status} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-4 transition-all",
                  stages[index - 1].count > 0 ? "bg-cyan-500/50" : "bg-slate-700",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-all",
                isActive ? config.active : config.pending,
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? config.dot || "bg-current" : "bg-slate-700",
                )}
              />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {config.label}
              </span>
              <span className="text-[10px] font-semibold tabular-nums">
                {stage.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface CapacityIndicatorProps {
  used: number;
  max: number;
  label?: string;
}

export function CapacityIndicator({ used, max, label }: CapacityIndicatorProps) {
  const percentage = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isOverCapacity = used > max;
  const isNearCapacity = percentage >= 80 && !isOverCapacity;

  const barColor = isOverCapacity
    ? "bg-rose-500"
    : isNearCapacity
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums",
              isOverCapacity ? "text-rose-300" : isNearCapacity ? "text-amber-300" : "text-slate-300",
            )}
          >
            {used}/{max}
          </span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1a2943]">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
