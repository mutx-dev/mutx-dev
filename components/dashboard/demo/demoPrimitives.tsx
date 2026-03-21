import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Plus,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  AgentCard,
  ConnectorCard,
  DeploymentRow,
  MatrixRow,
  Metric,
  QuickAction,
  Tone,
} from "@/components/dashboard/demo/demoContent";
import {
  buildArea,
  buildPath,
  toneBadgeClasses,
  toneDotClasses,
  toneTextClasses,
} from "@/components/dashboard/demo/demoContent";

export function SectionPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[999px] border px-2.5 text-[10px] font-medium tracking-[0.12em]",
        toneBadgeClasses(tone),
      )}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-[3px] text-[10px] font-medium tracking-[0.12em]",
        toneBadgeClasses(tone),
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", toneDotClasses(tone))} />
      {label}
    </span>
  );
}

export function SurfacePanel({
  title,
  meta,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex h-auto min-h-0 flex-col overflow-hidden rounded-[14px] border border-white/[0.05] bg-[#0a1016] lg:h-full",
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.05] px-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold leading-none tracking-[-0.03em] text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {meta ? (
            <span className="hidden text-[10px] font-medium tracking-[0.12em] text-white/26 sm:inline">
              {meta}
            </span>
          ) : null}
          {action}
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-visible p-2.5 lg:overflow-hidden lg:p-2", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="flex min-h-[54px] min-w-0 flex-col justify-between rounded-[10px] border border-white/[0.035] bg-[#0b1117] px-2.5 py-1.5">
      <div className="text-[10px] font-medium tracking-[0.12em] text-white/34">{metric.label}</div>
      <div className="truncate text-[18px] font-semibold leading-none tracking-[-0.04em] text-white">
        {metric.value}
      </div>
      <div className={cn("truncate text-[10px] font-medium tracking-[0.1em]", toneTextClasses(metric.tone ?? "neutral"))}>
        {metric.meta}
      </div>
    </div>
  );
}

export function OverviewCounter({ metric }: { metric: Metric }) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-between px-2.5 py-2 lg:px-3 lg:py-1.5">
      <div className="text-[10px] font-medium tracking-[0.12em] text-white/34">{metric.label}</div>
      <div className="truncate text-[19px] font-semibold leading-none tracking-[-0.04em] text-white lg:text-[18px]">
        {metric.value}
      </div>
      <div className={cn("truncate text-[10px] font-medium tracking-[0.1em]", toneTextClasses(metric.tone ?? "neutral"))}>
        {metric.meta}
      </div>
    </div>
  );
}

export function TopControl({
  label,
  icon: Icon,
  compact,
}: {
  label: string;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-[12px] border border-white/[0.06] bg-[#0d131a] text-sm text-white/82 transition hover:bg-[#101821] hover:text-white",
        compact ? "h-9 px-3" : "h-10 px-3.5",
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-white/40" /> : null}
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 text-white/28" />
    </button>
  );
}

export function SearchBar() {
  return (
    <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-white/[0.06] bg-[#0c1219] px-3.5 lg:h-9">
      <Search className="h-4 w-4 shrink-0 text-white/34" />
      <span className="truncate text-sm text-white/42">Jump to resource, run, event...</span>
      <div className="ml-auto hidden items-center gap-1 sm:flex">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/[0.06] bg-[#101821] text-white/44">
          <Plus className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex h-7 items-center justify-center rounded-[10px] border border-white/[0.06] bg-[#101821] px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
          /
        </span>
      </div>
    </div>
  );
}

export function SignalToneIcon({ tone }: { tone: Tone }) {
  if (tone === "healthy") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  }

  if (tone === "warning") {
    return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  }

  if (tone === "critical") {
    return <ShieldAlert className="h-4 w-4 text-rose-300" />;
  }

  if (tone === "focus") {
    return <Activity className="h-4 w-4 text-cyan-300" />;
  }

  return <Clock3 className="h-4 w-4 text-white/48" />;
}

export function QuickActionButton({
  action,
  active,
}: {
  action: QuickAction;
  active: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 items-center justify-between rounded-[12px] border px-2.5 text-left transition",
        active
          ? "border-cyan-400/22 bg-cyan-400/10 text-cyan-100"
          : "border-white/[0.055] bg-[#0d131a] text-white/78 hover:bg-[#111822] hover:text-white",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{action.label}</div>
        <div className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-white/32">
          {action.detail}
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0" />
    </button>
  );
}

export function Sparkline({
  points,
  strokeClassName = "stroke-cyan-300",
  fillClassName = "fill-cyan-400/10",
}: {
  points: number[];
  strokeClassName?: string;
  fillClassName?: string;
}) {
  const linePath = buildPath(points, 420, 132);
  const areaPath = buildArea(points, 420, 132);

  return (
    <svg viewBox="0 0 420 132" className="h-full w-full">
      <path d={areaPath} className={fillClassName} />
      <path d={linePath} className={cn("fill-none stroke-[2]", strokeClassName)} />
    </svg>
  );
}

export function ProgressRow({
  label,
  value,
  tone = "focus",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-white/58">{label}</span>
        <span className={cn("font-medium", toneTextClasses(tone))}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.05]">
        <div
          className={cn(
            "h-2 rounded-full",
            tone === "healthy"
              ? "bg-emerald-300"
              : tone === "warning"
                ? "bg-amber-300"
                : tone === "critical"
                  ? "bg-rose-300"
                  : "bg-cyan-300",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function EnvironmentMatrix({
  rows,
  showMeta = false,
}: {
  rows: MatrixRow[];
  showMeta?: boolean;
}) {
  return (
    <div className="h-full min-h-0 overflow-x-auto overflow-y-hidden">
      <div className="min-w-[720px] overflow-hidden rounded-[14px] border border-white/[0.055] bg-[#0d131a]">
        <div className="grid grid-cols-[132px_repeat(3,minmax(0,1fr))] border-b border-white/[0.05] bg-[#0f151c]">
          <div className="h-7 border-r border-white/[0.05]" />
          {["Production", "Staging", "Development"].map((column) => (
            <div
              key={column}
              className="flex h-7 items-center border-r border-white/[0.05] px-3 text-[10px] font-semibold tracking-[0.12em] text-white/76 last:border-r-0"
            >
              {column}
            </div>
          ))}
        </div>
        <div className="grid grid-rows-6">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid h-8 grid-cols-[132px_repeat(3,minmax(0,1fr))] border-b border-white/[0.05] bg-[#0b1118] last:border-b-0"
            >
              <div className="flex flex-col justify-center border-r border-white/[0.05] px-3">
                <div className="truncate text-[11px] font-medium text-white">{row.label}</div>
                {showMeta ? (
                  <div className="truncate text-[9px] tracking-[0.1em] text-white/30">{row.meta}</div>
                ) : null}
              </div>
              {row.cells.map((cell, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-r border-white/[0.05] px-3 last:border-r-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold leading-none text-white">{cell.value}</div>
                    <div className="truncate text-[9px] leading-none text-white/42">{cell.detail}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge label={cell.badge} tone={cell.tone} />
                    <div className="text-[9px] tracking-[0.1em] text-white/26">{cell.stamp}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EnvironmentCardsMobile({
  rows,
}: {
  rows: MatrixRow[];
}) {
  const environments = ["Production", "Staging", "Development"];

  return (
    <div className="grid gap-2.5 md:hidden">
      {environments.map((environment, envIndex) => (
        <div key={environment} className="overflow-hidden rounded-[14px] border border-white/[0.055] bg-[#0d131a]">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2.5">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-white/80">{environment}</div>
            <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">snapshot</div>
          </div>
          <div>
            {rows.slice(0, 5).map((row) => {
              const cell = row.cells[envIndex];

              return (
                <div
                  key={`${environment}-${row.label}`}
                  className="grid grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] gap-3 border-b border-white/[0.05] px-3 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium tracking-[0.12em] text-white/38">{row.label}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-white/34">{row.meta}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-white">{cell.value}</div>
                    <div className="truncate text-[10px] text-white/42">{cell.detail}</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge label={cell.badge} tone={cell.tone} />
                      <span className="text-[9px] tracking-[0.12em] text-white/26">{cell.stamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeploymentsTable({
  rows,
}: {
  rows: DeploymentRow[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-auto overflow-y-hidden">
      <div className="min-w-[760px]">
        <div className="grid h-8 shrink-0 grid-cols-[1.45fr_0.88fr_0.88fr_0.72fr_0.72fr_0.86fr_0.72fr] items-center border-b border-white/[0.055] px-3 text-[10px] font-medium tracking-[0.12em] text-white/32">
          {["Agent", "Runtime", "Environment", "Version", "Region", "Health", "Rollout"].map((heading) => (
            <div key={heading}>{heading}</div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          {rows.map((row) => (
            <div
              key={`${row.agent}-${row.version}`}
              className="grid h-[44px] grid-cols-[1.45fr_0.88fr_0.88fr_0.72fr_0.72fr_0.86fr_0.72fr] items-center border-b border-white/[0.05] px-3 text-[12px] last:border-b-0"
            >
              <div className="truncate font-medium text-white">{row.agent}</div>
              <div className="truncate text-white/66">{row.runtime}</div>
              <div className="truncate text-white/66">{row.environment}</div>
              <div className="truncate text-white/66">{row.version}</div>
              <div className="truncate text-white/66">{row.region}</div>
              <div className="truncate">
                <StatusBadge label={row.health} tone={row.tone} />
              </div>
              <div className="truncate text-[10px] font-medium tracking-[0.12em] text-white/32">{row.rollout}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecordStack({
  items,
}: {
  items: Array<{ title: string; detail: string; meta: string; tone: Tone }>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-visible pr-0 lg:overflow-auto lg:overscroll-contain lg:pr-1">
      {items.map((item) => (
        <div key={item.title} className="rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
          <div className="flex items-start gap-3">
            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", toneDotClasses(item.tone))} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-white">{item.title}</div>
              <div className="mt-1 overflow-hidden text-[12px] leading-5 text-white/56 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {item.detail}
              </div>
              <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-white/30">{item.meta}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConnectorGrid({
  connectors,
}: {
  connectors: ConnectorCard[];
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {connectors.map((connector) => (
        <div key={connector.name} className="flex min-h-0 flex-col justify-between rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-2.5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-white">{connector.name}</div>
              <StatusBadge label={connector.status} tone={connector.tone} />
            </div>
            <div className="mt-2 overflow-hidden text-[12px] leading-5 text-white/56 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {connector.detail}
            </div>
          </div>
          <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">{connector.stamp}</div>
        </div>
      ))}
    </div>
  );
}

export function AgentRegistryCard({
  card,
}: {
  card: AgentCard;
}) {
  return (
    <div className="flex min-h-[112px] flex-col rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold text-white">{card.name}</div>
          <div className="mt-1 text-[12px] text-white/44">{card.role}</div>
        </div>
        <StatusBadge label={card.status} tone={card.tone} />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
        <div>
          <div>model</div>
          <div className="mt-1 truncate text-[12px] normal-case tracking-normal text-white/62">{card.model}</div>
        </div>
        <div>
          <div>load</div>
          <div className="mt-1 text-[12px] normal-case tracking-normal text-white/62">{card.load}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/34">
        <span>{card.env}</span>
        <span>{card.lastSeen}</span>
      </div>
    </div>
  );
}

export function RailSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-white/[0.055] bg-[#0a1016]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.05] px-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/76">{title}</h2>
        {meta ? <span className="hidden text-[10px] font-medium tracking-[0.12em] text-white/28 sm:inline">{meta}</span> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-visible p-2.5 lg:overflow-hidden">{children}</div>
    </section>
  );
}

export function SectionIntroBar({
  label,
  detail,
  children,
}: {
  label: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-[16px] border border-white/[0.06] bg-[#0b1118] px-3 py-3 sm:px-4 lg:h-11 lg:flex-row lg:items-center lg:justify-between lg:py-0">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">{label}</span>
        <span className="hidden h-4 w-px bg-white/[0.08] sm:block" />
        <span className="text-[13px] leading-5 text-white/58 sm:text-sm sm:leading-5">{detail}</span>
      </div>
      {children ? <div className="hidden items-center gap-2 lg:flex">{children}</div> : null}
    </div>
  );
}
