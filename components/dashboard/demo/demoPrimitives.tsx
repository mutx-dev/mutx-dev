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
  ShieldAlert,
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

const PANEL_CHROME =
  "relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,19,25,0.96)_0%,rgba(7,10,15,0.98)_100%)] shadow-[0_24px_90px_rgba(2,6,12,0.32)]";

export function SectionPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        toneBadgeClasses(tone),
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDotClasses(tone))} />
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
    <section className={cn(PANEL_CHROME, "flex h-auto min-h-0 flex-col", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03),transparent)]" />
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4">
        <div className="min-w-0">
          <h2 className="truncate font-[family:var(--font-control-display)] text-[1rem] font-semibold tracking-[-0.03em] text-white">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {meta ? (
            <span className="hidden rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42 sm:inline">
              {meta}
            </span>
          ) : null}
          {action}
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-visible p-3 lg:overflow-hidden", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="relative flex min-h-[92px] min-w-0 flex-col justify-between overflow-hidden rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(14,19,26,0.95)_0%,rgba(8,12,17,0.98)_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">{metric.label}</div>
      <div className="mt-3 font-[family:var(--font-control-display)] text-[1.85rem] font-semibold leading-none tracking-[-0.06em] text-white">
        {metric.value}
      </div>
      <div className={cn("mt-2 text-[11px] font-medium tracking-[0.04em]", toneTextClasses(metric.tone ?? "neutral"))}>
        {metric.meta}
      </div>
    </div>
  );
}

export function OverviewCounter({ metric }: { metric: Metric }) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-between rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">{metric.label}</div>
      <div className="font-[family:var(--font-control-display)] text-[1.5rem] font-semibold leading-none tracking-[-0.05em] text-white">
        {metric.value}
      </div>
      <div className={cn("text-[11px] font-medium", toneTextClasses(metric.tone ?? "neutral"))}>{metric.meta}</div>
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
        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,24,33,0.96)_0%,rgba(10,14,20,0.98)_100%)] text-sm text-white/82 transition hover:border-white/[0.12] hover:bg-[#121924] hover:text-white",
        compact ? "h-10 px-3.5" : "h-11 px-4",
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-white/38" /> : null}
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="h-3.5 w-3.5 text-white/28" />
    </button>
  );
}

export function SearchBar() {
  return (
    <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.98)_0%,rgba(9,13,18,1)_100%)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:h-10">
      <Search className="h-4 w-4 shrink-0 text-white/38" />
      <span className="truncate text-sm text-white/42">Jump to resource, run, event...</span>
      <div className="ml-auto hidden items-center gap-1.5 sm:flex">
        <span className="inline-flex h-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
          demo
        </span>
        <span className="inline-flex h-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
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
        "group flex min-h-11 items-center justify-between rounded-[16px] border px-3.5 py-2 text-left transition",
        active
          ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-50 shadow-[0_16px_42px_rgba(8,145,178,0.18)]"
          : "border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] text-white/82 hover:border-white/[0.12] hover:bg-[#121924] hover:text-white",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{action.label}</div>
        <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/34">
          {action.detail}
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
      {[24, 66, 108].map((y) => (
        <path
          key={y}
          d={`M 0 ${y} L 420 ${y}`}
          className="stroke-white/[0.05] stroke-[1]"
        />
      ))}
      <path d={linePath} className={cn("fill-none stroke-[2.25]", strokeClassName)} />
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-white/64">{label}</span>
        <span className={cn("font-semibold", toneTextClasses(tone))}>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-2.5 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.05)]",
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
      <div className="min-w-[760px] overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#0d1319] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="grid grid-cols-[148px_repeat(3,minmax(0,1fr))] border-b border-white/[0.06] bg-[#111821]">
          <div className="h-9 border-r border-white/[0.06]" />
          {["Production", "Staging", "Development"].map((column) => (
            <div
              key={column}
              className="flex h-9 items-center border-r border-white/[0.06] px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/76 last:border-r-0"
            >
              {column}
            </div>
          ))}
        </div>
        <div className="grid grid-rows-6">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid min-h-[54px] grid-cols-[148px_repeat(3,minmax(0,1fr))] border-b border-white/[0.05] bg-[#0c1117] last:border-b-0"
            >
              <div className="flex flex-col justify-center border-r border-white/[0.06] px-3 py-2">
                <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{row.label}</div>
                {showMeta ? (
                  <div className="truncate text-[9px] tracking-[0.12em] text-white/30">{row.meta}</div>
                ) : null}
              </div>
              {row.cells.map((cell, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-r border-white/[0.06] px-3 py-2.5 last:border-r-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-white">{cell.value}</div>
                    <div className="truncate text-[10px] text-white/44">{cell.detail}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge label={cell.badge} tone={cell.tone} />
                    <div className="text-[9px] tracking-[0.14em] text-white/24">{cell.stamp}</div>
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
    <div className="grid gap-3 md:hidden">
      {environments.map((environment, envIndex) => (
        <div key={environment} className={cn(PANEL_CHROME, "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">{environment}</div>
            <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/34">
              snapshot
            </div>
          </div>
          <div>
            {rows.slice(0, 5).map((row) => {
              const cell = row.cells[envIndex];

              return (
                <div
                  key={`${environment}-${row.label}`}
                  className="grid grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] gap-3 border-b border-white/[0.05] px-3 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/38">{row.label}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-white/34">{row.meta}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-white">{cell.value}</div>
                    <div className="mt-1 text-[11px] leading-4 text-white/44">{cell.detail}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge label={cell.badge} tone={cell.tone} />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/26">{cell.stamp}</span>
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
      <div className="min-w-[780px]">
        <div className="grid h-10 shrink-0 grid-cols-[1.45fr_0.88fr_0.88fr_0.72fr_0.72fr_0.86fr_0.72fr] items-center border-b border-white/[0.06] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/34">
          {["Agent", "Runtime", "Environment", "Version", "Region", "Health", "Rollout"].map((heading) => (
            <div key={heading}>{heading}</div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          {rows.map((row) => (
            <div
              key={`${row.agent}-${row.version}`}
              className="grid min-h-[52px] grid-cols-[1.45fr_0.88fr_0.88fr_0.72fr_0.72fr_0.86fr_0.72fr] items-center border-b border-white/[0.05] px-4 text-[12px] transition hover:bg-white/[0.03] last:border-b-0"
            >
              <div className="truncate font-semibold text-white">{row.agent}</div>
              <div className="truncate text-white/66">{row.runtime}</div>
              <div className="truncate text-white/66">{row.environment}</div>
              <div className="truncate text-white/66">{row.version}</div>
              <div className="truncate text-white/66">{row.region}</div>
              <div className="truncate">
                <StatusBadge label={row.health} tone={row.tone} />
              </div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{row.rollout}</div>
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
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-visible pr-0 lg:overflow-auto lg:overscroll-contain lg:pr-1">
      {items.map((item) => (
        <div
          key={item.title}
          className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5"
        >
          <div
            className={cn(
              "absolute left-0 top-4 bottom-4 w-[3px] rounded-full",
              item.tone === "healthy"
                ? "bg-emerald-300"
                : item.tone === "warning"
                  ? "bg-amber-300"
                  : item.tone === "critical"
                    ? "bg-rose-300"
                    : item.tone === "focus"
                      ? "bg-cyan-300"
                      : "bg-white/32",
            )}
          />
          <div className="flex items-start gap-3">
            <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneDotClasses(item.tone))} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-white">{item.title}</div>
              <div className="mt-1.5 overflow-hidden text-[12px] leading-5 text-white/58 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                {item.detail}
              </div>
              <div className={cn("mt-3 text-[10px] font-semibold uppercase tracking-[0.14em]", toneTextClasses(item.tone))}>
                {item.meta}
              </div>
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
        <div
          key={connector.name}
          className="relative flex min-h-0 flex-col justify-between overflow-hidden rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.16),transparent)]" />
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-semibold text-white">{connector.name}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                  integration contract
                </div>
              </div>
              <StatusBadge label={connector.status} tone={connector.tone} />
            </div>
            <div className="mt-3 overflow-hidden text-[12px] leading-5 text-white/58 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
              {connector.detail}
            </div>
          </div>
          <div className="mt-4 inline-flex w-fit items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
            {connector.stamp}
          </div>
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
    <div className="relative flex min-h-[132px] flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(9,13,18,1)_100%)] p-3.5">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.16),transparent)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-[family:var(--font-control-display)] text-[1.05rem] font-semibold tracking-[-0.03em] text-white">
            {card.name}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">{card.role}</div>
        </div>
        <StatusBadge label={card.status} tone={card.tone} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <div>model</div>
          <div className="mt-1 truncate text-[12px] normal-case tracking-normal text-white/66">{card.model}</div>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <div>load</div>
          <div className="mt-1 text-[12px] normal-case tracking-normal text-white/66">{card.load}</div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
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
    <section className={cn(PANEL_CHROME, "flex min-h-0 flex-col")}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3.5">
        <h2 className="font-[family:var(--font-control-display)] text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
          {title}
        </h2>
        {meta ? (
          <span className="hidden rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34 sm:inline">
            {meta}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-visible p-3 lg:overflow-hidden">{children}</div>
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
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,21,29,0.96)_0%,rgba(8,12,17,0.98)_100%)] px-4 py-4 shadow-[0_24px_90px_rgba(2,6,12,0.24)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/16 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
              {label}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
              operator briefing
            </span>
          </div>
          <div className="mt-3 max-w-4xl font-[family:var(--font-control-display)] text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[1.8rem]">
            {detail}
          </div>
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2 lg:max-w-[42%] lg:justify-end">{children}</div>
        ) : null}
      </div>
    </section>
  );
}
