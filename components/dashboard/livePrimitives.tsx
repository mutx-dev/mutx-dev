import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight, Lock, Sparkles } from "lucide-react";

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
    normalized.includes("pending")
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
        "dashboard-entry overflow-hidden rounded-[22px] border shadow-[0_18px_48px_rgba(1,5,11,0.24)]",
        className,
      )}
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradient,
        boxShadow: dashboardTokens.shadowSm,
      }}
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{
          borderColor: dashboardTokens.borderSubtle,
          backgroundColor: "color-mix(in srgb, rgba(17, 24, 33, 0.94) 86%, transparent)",
        }}
      >
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-semibold uppercase tracking-[0.12em] text-[#eff5fb]">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {meta ? (
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-[#7f92a6] sm:inline">
              {meta}
            </span>
          ) : null}
          {action}
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
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
      className="dashboard-entry rounded-[18px] border p-3.5"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        background: dashboardTokens.panelGradientStrong,
        boxShadow: dashboardTokens.shadowSm,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f92a6]">{label}</p>
          <p className="mt-2 truncate text-[1.22rem] font-semibold tracking-[-0.04em] text-[#f3f7fb]">
            {value}
          </p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <p className="mt-3 text-[12px] leading-5 text-[#9fb0c2]">{detail}</p>
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
      className="rounded-[16px] border p-3"
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
  return (
    <LivePanel title={title} meta="auth required">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(260px,0.92fr)]">
        <div
          className="rounded-[20px] border p-4"
          style={{
            borderColor: dashboardTokens.borderStrong,
            background: dashboardTokens.panelGradientStrong,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border"
              style={{
                borderColor: dashboardTokens.borderStrong,
                backgroundColor: dashboardTokens.bgSurfaceHigher,
                color: dashboardTokens.brand,
              }}
            >
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8091a3]">
                Sign-in gate
              </p>
              <p className="mt-2 text-base font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            "Run the MUTX setup lane or sign back in with the active operator account.",
            "Once authenticated, this route swaps the gate state for the real control-plane payload.",
          ].map((note) => (
            <div
              key={note}
              className="rounded-[18px] border px-4 py-3"
              style={{
                borderColor: dashboardTokens.borderSubtle,
                backgroundColor: dashboardTokens.bgSurface,
              }}
            >
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
                <p className="text-sm leading-6 text-slate-300">{note}</p>
              </div>
            </div>
          ))}
        </div>
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
      className="flex items-center gap-4 rounded-xl border px-4 py-2.5 overflow-x-auto"
      style={{
        borderColor: dashboardTokens.borderSubtle,
        backgroundColor: dashboardTokens.bgInset,
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
