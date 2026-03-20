"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cpu,
  CreditCard,
  Database,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  KeyRound,
  Layers3,
  MoreHorizontal,
  Network,
  Play,
  Plus,
  Search,
  Server,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";

import type { DemoSection } from "@/components/dashboard/demo/demoSections";
import { cn } from "@/lib/utils";

type Tone = "healthy" | "warning" | "critical" | "focus" | "neutral";

type DemoNavItem = {
  key: DemoSection;
  label: string;
  href: string;
  icon: LucideIcon;
};

type Metric = {
  label: string;
  value: string;
  meta: string;
  tone?: Tone;
};

type SignalItem = {
  title: string;
  detail: string;
  tone: Tone;
  stamp: string;
};

type AuditItem = {
  title: string;
  resource: string;
  actor: string;
  role: string;
  stamp: string;
};

type MatrixCell = {
  value: string;
  detail: string;
  stamp: string;
  tone: Tone;
  badge: string;
};

type MatrixRow = {
  label: string;
  meta: string;
  cells: MatrixCell[];
};

type DeploymentRow = {
  agent: string;
  runtime: string;
  environment: string;
  version: string;
  region: string;
  health: string;
  tone: Tone;
  rollout: string;
};

type AgentCard = {
  name: string;
  role: string;
  model: string;
  env: string;
  status: string;
  tone: Tone;
  lastSeen: string;
  load: string;
};

type ConnectorCard = {
  name: string;
  detail: string;
  status: string;
  tone: Tone;
  stamp: string;
};

type QuickAction = {
  label: string;
  detail: string;
};

const NAV_ITEMS: DemoNavItem[] = [
  { key: "overview", label: "Overview", href: "/", icon: ShieldCheck },
  { key: "agents", label: "Agents", href: "/agents", icon: Bot },
  { key: "deployments", label: "Deployments", href: "/deployments", icon: Layers3 },
  { key: "runs", label: "Runs", href: "/runs", icon: Play },
  { key: "environments", label: "Environments", href: "/environments", icon: Globe },
  { key: "access", label: "Access", href: "/access", icon: KeyRound },
  { key: "connectors", label: "Connectors", href: "/connectors", icon: Webhook },
  { key: "audit", label: "Audit", href: "/audit", icon: Workflow },
  { key: "usage", label: "Usage", href: "/usage", icon: Wallet },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings2 },
];

const SECTION_META: Record<
  DemoSection,
  { eyebrow: string; title: string; detail: string; chips: string[] }
> = {
  overview: {
    eyebrow: "Control Plane",
    title: "Command center for agent infrastructure",
    detail: "Deploy, observe, govern, and recover agents across bounded environments.",
    chips: ["Production", "Governed", "BYOK"],
  },
  agents: {
    eyebrow: "Agent Registry",
    title: "Fleet inventory and operator control",
    detail: "Wake, inspect, and coordinate the operating fleet.",
    chips: ["56 agents", "12 heartbeats", "4 approvals"],
  },
  deployments: {
    eyebrow: "Rollout Surface",
    title: "Release posture across environments",
    detail: "Track versions, regions, rollback windows, and runtime health.",
    chips: ["24 versions", "3 rollout lanes", "2 watch items"],
  },
  runs: {
    eyebrow: "Run Control",
    title: "Execution load and recovery queue",
    detail: "Observe active runs, triage failures, and keep queue pressure inside threshold.",
    chips: ["187 runs", "94.7% success", "7 recoveries"],
  },
  environments: {
    eyebrow: "Environment Posture",
    title: "Isolation, readiness, and network stance",
    detail: "Production, staging, and development should read like bounded systems.",
    chips: ["Prod isolated", "Staging warm", "Dev sandboxed"],
  },
  access: {
    eyebrow: "Access Surface",
    title: "Auth, API keys, and delegated trust",
    detail: "Rotate credentials, inspect anomalies, and separate operator trust from runtime execution.",
    chips: ["14 keys", "2 BYOK tenants", "1 watch item"],
  },
  connectors: {
    eyebrow: "Connector Plane",
    title: "Webhooks, retries, and external contracts",
    detail: "Operate delivery health across external systems.",
    chips: ["12 connectors", "2 retries", "1 delayed lane"],
  },
  audit: {
    eyebrow: "Governance Record",
    title: "Operator actions and system decisions",
    detail: "Human and automated changes should be reviewable and attributable.",
    chips: ["73 events", "4 transfers", "0 missing actors"],
  },
  usage: {
    eyebrow: "Usage Split",
    title: "Infra cost, model spend, and pressure",
    detail: "Keep infrastructure cost separate from model consumption.",
    chips: ["$1.7k infra", "$970 model", "57% headroom"],
  },
  settings: {
    eyebrow: "Control Settings",
    title: "Runtime defaults and policy guardrails",
    detail: "Set the defaults that shape deployments, approvals, keys, and recovery.",
    chips: ["2 policy packs", "Dedicated envs", "Guardrails on"],
  },
};

const BASE_SIGNALS: Array<Omit<SignalItem, "stamp">> = [
  {
    title: "Deployment succeeded",
    detail: "Sales Ops Assistant promoted to production on OpenClaw with no dropped runs.",
    tone: "healthy",
  },
  {
    title: "Webhook retry succeeded",
    detail: "Stripe delivery recovered after a transient 502; backlog drained.",
    tone: "healthy",
  },
  {
    title: "Policy block",
    detail: "Unauthorized tool action stopped before egress crossed the tenant boundary.",
    tone: "warning",
  },
  {
    title: "Self-heal restart",
    detail: "Research Automator replaced a hot replica and returned to ready in 17 seconds.",
    tone: "focus",
  },
  {
    title: "Budget threshold warning",
    detail: "Model spend crossed 78% of the daily envelope; infra cost remains inside target.",
    tone: "warning",
  },
  {
    title: "API key rotated",
    detail: "Operator credential rotated without invalidating governed webhook deliveries.",
    tone: "focus",
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Deploy new version", detail: "Promote rollout" },
  { label: "Rotate key", detail: "Refresh access" },
  { label: "Inspect failed run", detail: "Open recovery" },
  { label: "Provision environment", detail: "Create environment" },
  { label: "Create webhook", detail: "Add connector" },
];

const AGENT_NAMES = [
  "dogfood",
  "jarv",
  "research",
  "ops",
  "security",
  "kb-manager",
  "automation-architect",
  "sales-assistant",
  "data-processor",
  "crawler",
  "council-ada",
  "council-aristotle",
];

function relativeStamp(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes}m ago`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h ago` : `${hours}h ${minutes}m ago`;
}

function rotate<T>(items: T[], offset: number) {
  if (items.length === 0) {
    return items;
  }

  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function toneBadgeClasses(tone: Tone) {
  switch (tone) {
    case "healthy":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "warning":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "critical":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "focus":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    default:
      return "border-white/8 bg-white/[0.03] text-white/60";
  }
}

function toneTextClasses(tone: Tone) {
  switch (tone) {
    case "healthy":
      return "text-emerald-300";
    case "warning":
      return "text-amber-300";
    case "critical":
      return "text-rose-300";
    case "focus":
      return "text-cyan-300";
    default:
      return "text-white/60";
  }
}

function toneDotClasses(tone: Tone) {
  switch (tone) {
    case "healthy":
      return "bg-emerald-300";
    case "warning":
      return "bg-amber-300";
    case "critical":
      return "bg-rose-300";
    case "focus":
      return "bg-cyan-300";
    default:
      return "bg-white/40";
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 1,
  }).format(value);
}

function buildPath(points: number[], width: number, height: number) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildArea(points: number[], width: number, height: number) {
  return `${buildPath(points, width, height)} L ${width} ${height} L 0 ${height} Z`;
}

function SectionPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
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

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
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

function SurfacePanel({
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

function MetricCard({ metric }: { metric: Metric }) {
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

function OverviewCounter({ metric }: { metric: Metric }) {
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

function TopControl({
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

function SearchBar() {
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

function SignalToneIcon({ tone }: { tone: Tone }) {
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

function QuickActionButton({
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

function Sparkline({
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

function ProgressRow({
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

function EnvironmentMatrix({
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

function DeploymentsTable({
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
              className="grid h-[48px] grid-cols-[1.45fr_0.88fr_0.88fr_0.72fr_0.72fr_0.86fr_0.72fr] items-center border-b border-white/[0.05] px-3 text-[13px] last:border-b-0"
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

function RecordStack({
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

function ConnectorGrid({
  connectors,
}: {
  connectors: ConnectorCard[];
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {connectors.map((connector) => (
        <div key={connector.name} className="flex min-h-0 flex-col justify-between rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
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

function AgentRegistryCard({
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

function RailSection({
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

function SectionIntroBar({
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

function OverviewSection({
  tick,
  signals,
  auditItems,
  activeAction,
}: {
  tick: number;
  signals: SignalItem[];
  auditItems: AuditItem[];
  activeAction: number;
}) {
  const cycle = tick % 6;
  const metrics: Metric[] = [
    { label: "Agents", value: `${56 + (tick % 3)}`, meta: "fleet", tone: "focus" },
    { label: "Deployments", value: `${24 + (tick % 2)}`, meta: "active", tone: "neutral" },
    { label: "Runs (24h)", value: `${187 + ((tick * 7) % 18)}`, meta: "throughput", tone: "healthy" },
    { label: "Success rate", value: `${(94.7 + Math.sin(tick / 2.4) * 0.4).toFixed(1)}%`, meta: "success", tone: "focus" },
    { label: "Infra cost", value: formatCurrency(2.3 + ((tick % 5) * 0.2)), meta: "today", tone: "focus" },
    { label: "Incidents", value: `${2 + (tick % 2)}`, meta: "open", tone: cycle === 1 ? "warning" : "neutral" },
  ];

  const rows: MatrixRow[] = [
    {
      label: "Deployments",
      meta: "runtime mix",
      cells: [
        { value: `${12 + (tick % 2)} active`, detail: "OpenClaw + LangChain", stamp: relativeStamp(2 + cycle), tone: "healthy", badge: "OK" },
        { value: `${7 + ((tick + 1) % 2)} active`, detail: "candidate rollouts", stamp: relativeStamp(6 + cycle), tone: "focus", badge: "Active" },
        { value: `${5 + (tick % 3)} sandboxes`, detail: "n8n + OpenClaw", stamp: relativeStamp(3 + cycle), tone: "neutral", badge: "Ready" },
      ],
    },
    {
      label: "Active runs",
      meta: "queue pressure",
      cells: [
        { value: `${86 + (tick % 7)} live`, detail: "queue steady", stamp: relativeStamp(1), tone: "healthy", badge: "OK" },
        { value: `${19 + (tick % 4)} live`, detail: "replay window", stamp: relativeStamp(4), tone: cycle === 2 ? "warning" : "focus", badge: cycle === 2 ? "Watch" : "Active" },
        { value: `${14 + (tick % 5)} live`, detail: "bursting", stamp: relativeStamp(2), tone: cycle === 4 ? "warning" : "neutral", badge: cycle === 4 ? "Watch" : "Ready" },
      ],
    },
    {
      label: "Policy state",
      meta: "guardrails",
      cells: [
        { value: cycle === 3 ? "2 blocks" : "1 block", detail: "tool egress denied", stamp: relativeStamp(10 + cycle), tone: "warning", badge: "Watch" },
        { value: "simulate mode", detail: "candidate rules", stamp: relativeStamp(12 + cycle), tone: "focus", badge: "Active" },
        { value: "learning", detail: "signal capture", stamp: relativeStamp(7 + cycle), tone: "neutral", badge: "Ready" },
      ],
    },
    {
      label: "Keys / secrets",
      meta: "access hygiene",
      cells: [
        { value: `${14 + (tick % 2)} healthy`, detail: cycle === 1 ? "1 rotation due" : "inside rotation window", stamp: relativeStamp(8 + cycle), tone: cycle === 1 ? "warning" : "healthy", badge: cycle === 1 ? "Watch" : "OK" },
        { value: "6 rotated", detail: "staged credentials current", stamp: relativeStamp(18 + cycle), tone: "healthy", badge: "OK" },
        { value: "4 ephemeral", detail: "sandbox scoped", stamp: relativeStamp(5 + cycle), tone: "focus", badge: "Active" },
      ],
    },
    {
      label: "Network posture",
      meta: "traffic stance",
      cells: [
        { value: "private mesh", detail: "egress pinned", stamp: relativeStamp(1 + cycle), tone: "healthy", badge: "OK" },
        { value: "relay warm", detail: "regional failover armed", stamp: relativeStamp(7 + cycle), tone: "focus", badge: "Active" },
        { value: "shared gateway", detail: "tool fanout enabled", stamp: relativeStamp(3 + cycle), tone: "neutral", badge: "Ready" },
      ],
    },
    {
      label: "Health / readiness",
      meta: "service probes",
      cells: [
        { value: `${(99.94 + Math.sin(tick / 3.4) * 0.03).toFixed(2)}%`, detail: "ready / healthy", stamp: relativeStamp(1), tone: "healthy", badge: "OK" },
        { value: cycle === 5 ? "warming" : "ready", detail: cycle === 5 ? "one replica catching up" : "fleet responsive", stamp: relativeStamp(2 + cycle), tone: cycle === 5 ? "warning" : "healthy", badge: cycle === 5 ? "Watch" : "OK" },
        { value: "ready", detail: "sandbox probes green", stamp: relativeStamp(2 + cycle), tone: "healthy", badge: "OK" },
      ],
    },
  ];

  const deployments: DeploymentRow[] = [
    { agent: "Sales Ops Assistant", runtime: "OpenClaw", environment: "Production", version: `v1.4.${tick % 2}`, region: "EU-West", health: "Healthy", tone: "healthy", rollout: relativeStamp(4 + (tick % 4)) },
    { agent: "Data Processor", runtime: "LangChain", environment: "Staging", version: "v1.6.1", region: "US-East", health: tick % 5 === 0 ? "Policy Watch" : "Healthy", tone: tick % 5 === 0 ? "warning" : "healthy", rollout: relativeStamp(12 + (tick % 5)) },
    { agent: "Autonomous Crawler", runtime: "n8n", environment: "Development", version: `v0.9.${2 + (tick % 3)}`, region: "EU-West", health: "Healthy", tone: "healthy", rollout: relativeStamp(28 + (tick % 6)) },
    { agent: "Research Automator", runtime: "OpenClaw", environment: "Production", version: "v2.0.4", region: "US-West", health: tick % 6 === 3 ? "Self-healing" : "Healthy", tone: tick % 6 === 3 ? "focus" : "healthy", rollout: relativeStamp(34 + (tick % 7)) },
    { agent: "Billing Resolver", runtime: "LangChain", environment: "Staging", version: "v1.2.7", region: "US-East", health: "Healthy", tone: "healthy", rollout: relativeStamp(41 + (tick % 9)) },
    { agent: "Support Router", runtime: "OpenClaw", environment: "Production", version: "v1.8.3", region: "AP-South", health: tick % 4 === 1 ? "Policy Watch" : "Healthy", tone: tick % 4 === 1 ? "warning" : "healthy", rollout: relativeStamp(19 + (tick % 5)) },
    { agent: "Retrieval Indexer", runtime: "LangChain", environment: "Staging", version: "v0.8.9", region: "EU-Central", health: "Healthy", tone: "healthy", rollout: relativeStamp(52 + (tick % 7)) },
  ];

  const governance = [
    {
      title: "Policy block: Unauthorized tool action",
      detail: "Outbound connector call stopped before side effects escaped the boundary.",
      meta: `Production · ${relativeStamp(2 + (tick % 4))}`,
      tone: "warning" as Tone,
    },
    {
      title: "Seal decision: Human approval required",
      detail: "Privileged export held after ownership boundary and policy scope disagreed.",
      meta: `Staging · ${relativeStamp(11 + (tick % 6))}`,
      tone: tick % 3 === 0 ? ("critical" as Tone) : ("warning" as Tone),
    },
    {
      title: "API key hygiene warning",
      detail: "External operator credential is nearing rotation threshold with no recent successful use.",
      meta: `Access · ${relativeStamp(34 + (tick % 6))}`,
      tone: "warning" as Tone,
    },
    {
      title: "Ownership transfer recorded",
      detail: "Revenue Infra accepted the production rollout contract after the latest governed promotion.",
      meta: `Audit · ${relativeStamp(47 + (tick % 6))}`,
      tone: "focus" as Tone,
    },
  ];

  const connectors: ConnectorCard[] = [
    { name: "GitHub", detail: "Deploy hooks and release metadata", status: tick % 4 === 0 ? "Watch" : "Healthy", tone: tick % 4 === 0 ? "warning" : "healthy", stamp: relativeStamp(3 + (tick % 4)) },
    { name: "Stripe", detail: "Billing events on governed fanout", status: "Healthy", tone: "healthy", stamp: relativeStamp(1 + (tick % 3)) },
    { name: "Twilio", detail: "Outbound comms webhook delivery", status: tick % 5 === 2 ? "Retrying" : "Healthy", tone: tick % 5 === 2 ? "warning" : "healthy", stamp: relativeStamp(2 + (tick % 5)) },
    { name: "HubSpot", detail: "CRM sync and ownership projection", status: tick % 6 === 1 ? "Delayed" : "Healthy", tone: tick % 6 === 1 ? "warning" : "focus", stamp: relativeStamp(12 + (tick % 6)) },
  ];

  const points = Array.from({ length: 18 }, (_, index) => {
    const base = 20 + index * 1.6;
    const wave = Math.sin((index + tick) / 2.4) * 3.7;
    const lift = index > 11 ? (index - 11) * 1.1 : 0;
    return Number((base + wave + lift).toFixed(2));
  });

  return (
    <div className="flex min-h-0 flex-col gap-2.5 overflow-visible lg:h-full lg:overflow-hidden">
      <div className="shrink-0 overflow-hidden rounded-[10px] border border-white/[0.04] bg-[#0b1117]">
        <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-[#0b1117]">
              <OverviewCounter metric={metric} />
            </div>
          ))}
        </div>
      </div>

      <section className="flex shrink-0 flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[#0a1016] p-3 lg:h-[360px] xl:h-[368px]">
        <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1fr)_176px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.14em] text-cyan-200">Overview</span>
              <span className="hidden h-4 w-px bg-white/[0.08] lg:block" />
              <SectionPill label="Production lane" />
              <SectionPill label="Governed rollout" tone="healthy" />
              <SectionPill label="BYOK aware" />
            </div>
            <h1 className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.06em] text-white sm:text-[36px] lg:text-[40px]">
              Environment Matrix
            </h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-5 text-white/58 sm:text-[14px] sm:leading-6">
              Deployments, runs, policy, secrets, network posture, and readiness across production, staging, and development.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <div className="rounded-[12px] border border-white/[0.04] bg-[#0c1218] px-2.5 py-2">
              <div className="text-[10px] font-medium tracking-[0.12em] text-white/30">Change window</div>
              <div className="mt-1 text-[12px] font-medium leading-5 text-white">Governed rollout lane active</div>
            </div>
            <div className="rounded-[12px] border border-white/[0.04] bg-[#0c1218] px-2.5 py-2">
              <div className="text-[10px] font-medium tracking-[0.12em] text-white/30">Ownership</div>
              <div className="mt-1 text-[12px] font-medium leading-5 text-white">Acme Corp / Revenue Infra</div>
            </div>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <EnvironmentMatrix rows={rows} />
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.24fr)_minmax(0,0.76fr)] lg:overflow-hidden">
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,1.14fr)_minmax(0,0.7fr)] lg:overflow-hidden">
          <SurfacePanel title="Active Deployments" meta="fleet surface" bodyClassName="p-0 lg:p-0">
            <DeploymentsTable rows={deployments} />
          </SurfacePanel>

          <SurfacePanel title="Guardrails & Governance" meta="operator tension">
            <RecordStack items={governance} />
          </SurfacePanel>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,1fr)_minmax(0,0.78fr)] lg:overflow-hidden">
          <SurfacePanel title="Cost & Capacity" meta="infra vs model">
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
                  <div className="flex items-center gap-2 text-white/46">
                    <Server className="h-4 w-4 text-cyan-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em]">Infra spend</span>
                  </div>
                  <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">{formatCurrency(1730 + tick * 26)}</div>
                  <div className="mt-1 text-[11px] text-white/42">control plane / queues / env overhead</div>
                </div>
                <div className="rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
                  <div className="flex items-center gap-2 text-white/46">
                    <Wallet className="h-4 w-4 text-cyan-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em]">Model spend</span>
                  </div>
                  <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">{formatCurrency(970 + tick * 18)}</div>
                  <div className="mt-1 text-[11px] text-white/42">separate BYOK consumption envelope</div>
                </div>
              </div>
              <div className="min-h-0 flex-1 rounded-[12px] border border-white/[0.055] bg-[#0d131a] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">Load ridge</div>
                    <div className="mt-1 text-[13px] text-white/62">Queue pressure {38 + ((tick * 3) % 21)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-cyan-300">57% headroom</div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">63 req/s</div>
                  </div>
                </div>
                <div className="mt-3 h-[118px]">
                  <Sparkline points={points} />
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-[12px] border border-white/[0.055] bg-[#0d131a] px-3 py-2">
                  <div className="flex items-center gap-2 text-white/46">
                    <Cpu className="h-4 w-4 text-cyan-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em]">CPU</span>
                  </div>
                  <span className="text-[13px] font-medium text-white">55%</span>
                </div>
                <div className="flex items-center justify-between rounded-[12px] border border-white/[0.055] bg-[#0d131a] px-3 py-2">
                  <div className="flex items-center gap-2 text-white/46">
                    <HardDrive className="h-4 w-4 text-cyan-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em]">Memory</span>
                  </div>
                  <span className="text-[13px] font-medium text-white">47%</span>
                </div>
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel title="Connectors & Webhooks" meta="delivery plane">
            <ConnectorGrid connectors={connectors} />
          </SurfacePanel>
        </div>
      </div>

      <div className="grid gap-3 xl:hidden">
        <RailSection title="Live Signals" meta={`${signals.length} items`}>
          <div className="flex h-full min-h-0 flex-col gap-2">
            {signals.slice(0, 4).map((signal) => (
              <div key={`${signal.title}-${signal.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <SignalToneIcon tone={signal.tone} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-[13px] font-semibold text-white">{signal.title}</div>
                      <div className="text-[10px] font-medium tracking-[0.12em] text-white/30">{signal.stamp}</div>
                    </div>
                    <div className="mt-1 overflow-hidden text-[12px] leading-5 text-white/56 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                      {signal.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RailSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <RailSection title="Audit Trail" meta="operator actions">
            <div className="flex h-full min-h-0 flex-col gap-2">
              {auditItems.map((item) => (
                <div key={`${item.title}-${item.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-[12px] text-white/56">{item.resource}</div>
                      <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-white/30">
                        {item.role} · {item.actor}
                      </div>
                    </div>
                    <div className="text-[10px] font-medium tracking-[0.12em] text-white/30">{item.stamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </RailSection>

          <RailSection title="Quick Actions" meta="operator controls">
            <div className="flex h-full min-h-0 flex-col gap-2.5">
              {QUICK_ACTIONS.map((action, index) => (
                <QuickActionButton key={action.label} action={action} active={index === activeAction} />
              ))}
            </div>
          </RailSection>
        </div>
      </div>
    </div>
  );
}

function AgentsSection({ tick }: { tick: number }) {
  const agents: AgentCard[] = AGENT_NAMES.map((name, index) => {
    const active = (index + tick) % 5;
    const tone = active === 0 ? "healthy" : active === 1 ? "focus" : active === 2 ? "warning" : "neutral";
    return {
      name,
      role:
        index < 4
          ? "operator agent"
          : index < 8
            ? "specialist developer"
            : "governed assistant",
      model: index % 3 === 0 ? "gpt-5.3-codex" : index % 3 === 1 ? "qwen3.5:9b" : "claude-sonnet-4",
      env: index % 2 === 0 ? "production" : "staging",
      status: active === 0 ? "Live" : active === 1 ? "Syncing" : active === 2 ? "Review" : "Standby",
      tone,
      lastSeen: active === 0 ? "heartbeat 9s" : relativeStamp(12 + index * 3 + tick),
      load: `${18 + ((index * 9 + tick * 2) % 64)}%`,
    };
  });

  const commandQueue = [
    { title: "Wake security", detail: "staging · operator request", tone: "focus" as Tone },
    { title: "Spawn research", detail: "development · new workflow lane", tone: "healthy" as Tone },
    { title: "Review jarv output", detail: "production · seal requested", tone: "warning" as Tone },
    { title: "Pause crawler", detail: "development · connector delay", tone: "warning" as Tone },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar label="Agents" detail="Wake, inspect, and coordinate the operating fleet">
        <SectionPill label="56 total" tone="focus" />
        <SectionPill label="12 heartbeats" tone="healthy" />
      </SectionIntroBar>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:overflow-hidden">
        <SurfacePanel title="Agent Registry" meta="operator control">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <SectionPill label="Live" tone="healthy" />
                <SectionPill label="Sync config" tone="focus" />
                <SectionPill label="Needs review" tone="warning" />
              </div>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-cyan-400/20 bg-cyan-400/10 px-3.5 text-sm font-medium text-cyan-100"
              >
                <Plus className="h-4 w-4" />
                Add agent
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-visible pr-0 lg:overflow-auto lg:overscroll-contain lg:pr-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {agents.map((agent) => (
                  <AgentRegistryCard key={agent.name} card={agent} />
                ))}
              </div>
            </div>
          </div>
        </SurfacePanel>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.72fr)_minmax(0,1fr)] lg:overflow-hidden">
          <SurfacePanel title="Fleet posture" meta="signal summary">
            <div className="grid h-full min-h-0 grid-rows-[repeat(4,minmax(0,1fr))] gap-3">
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Agent capacity</div>
                <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">56</div>
                <div className="mt-1 text-[12px] text-white/44">production + staging + development</div>
              </div>
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Live heartbeats</div>
                <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{12 + (tick % 4)}</div>
                <div className="mt-1 text-[12px] text-white/44">agents reporting inside the watch window</div>
              </div>
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Wake queue</div>
                <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{1 + (tick % 3)}</div>
                <div className="mt-1 text-[12px] text-white/44">pending spawn or sync actions</div>
              </div>
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Assignment pressure</div>
                <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">{38 + ((tick * 2) % 18)}%</div>
                <div className="mt-1 text-[12px] text-white/44">review lanes + orchestration backlog</div>
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel title="Command Queue" meta="operator actions">
            <RecordStack
              items={commandQueue.map((item, index) => ({
                ...item,
                meta: `${item.detail} · ${relativeStamp(4 + index * 9 + tick)}`,
              }))}
            />
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function DeploymentsSection({ tick }: { tick: number }) {
  const rows: DeploymentRow[] = [
    { agent: "Sales Ops Assistant", runtime: "OpenClaw", environment: "Production", version: "v1.4.2", region: "EU-West", health: "Healthy", tone: "healthy", rollout: relativeStamp(4 + (tick % 3)) },
    { agent: "Data Processor", runtime: "LangChain", environment: "Staging", version: "v1.6.1", region: "US-East", health: "Healthy", tone: "healthy", rollout: relativeStamp(11 + (tick % 5)) },
    { agent: "Autonomous Crawler", runtime: "n8n", environment: "Development", version: "v0.9.4", region: "EU-West", health: "Healthy", tone: "healthy", rollout: relativeStamp(23 + (tick % 7)) },
    { agent: "Research Automator", runtime: "OpenClaw", environment: "Production", version: "v2.0.4", region: "US-West", health: "Self-healing", tone: "focus", rollout: relativeStamp(29 + (tick % 6)) },
    { agent: "Billing Resolver", runtime: "LangChain", environment: "Staging", version: "v1.2.7", region: "US-East", health: "Healthy", tone: "healthy", rollout: relativeStamp(41 + (tick % 8)) },
    { agent: "Support Router", runtime: "OpenClaw", environment: "Production", version: "v1.9.0", region: "AP-South", health: "Policy Watch", tone: "warning", rollout: relativeStamp(52 + (tick % 10)) },
  ];

  const rolloutLane = [
    { title: "Promote v1.4.3", detail: "Sales Ops Assistant · production", tone: "focus" as Tone },
    { title: "Rollback window open", detail: "Support Router · ap-south", tone: "warning" as Tone },
    { title: "Warm canary complete", detail: "Research Automator · us-west", tone: "healthy" as Tone },
    { title: "Replica drift detected", detail: "Data Processor · staging", tone: "warning" as Tone },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar label="Deployments" detail="Release inventory, regions, rollback windows, and runtime health">
        <SectionPill label="24 active versions" tone="focus" />
        <SectionPill label="2 watch items" tone="warning" />
      </SectionIntroBar>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:overflow-hidden">
        <SurfacePanel title="Active Deployments" meta="release inventory" bodyClassName="p-0 lg:p-0">
          <DeploymentsTable rows={rows} />
        </SurfacePanel>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.88fr)_minmax(0,1fr)] lg:overflow-hidden">
          <SurfacePanel title="Rollout Lane" meta="current decisions">
            <RecordStack
              items={rolloutLane.map((item, index) => ({
                ...item,
                meta: `${item.detail} · ${relativeStamp(3 + index * 8 + tick)}`,
              }))}
            />
          </SurfacePanel>
          <SurfacePanel title="Regional Capacity" meta="per region">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
              <ProgressRow label="EU-West" value={74 + ((tick * 2) % 8)} tone="healthy" />
              <ProgressRow label="US-East" value={66 + ((tick * 3) % 10)} tone="focus" />
              <ProgressRow label="US-West" value={58 + ((tick * 2) % 12)} tone="focus" />
              <ProgressRow label="AP-South" value={81 + (tick % 7)} tone="warning" />
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Version pressure</div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Three rollout candidates are waiting on policy seal before promotion into the production lane.
                </div>
              </div>
            </div>
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function RunsSection({ tick }: { tick: number }) {
  const runItems = [
    { title: "sales_ops:lead_sync", detail: "production · OpenClaw", tone: "healthy" as Tone },
    { title: "crawler:enrichment_batch", detail: "development · n8n", tone: "warning" as Tone },
    { title: "research:pricing_eval", detail: "staging · OpenClaw", tone: "focus" as Tone },
    { title: "billing:reconcile", detail: "production · LangChain", tone: "healthy" as Tone },
    { title: "support:ticket_triage", detail: "production · OpenClaw", tone: "focus" as Tone },
  ];

  const recoveryItems = [
    { title: "Retry failed batch", detail: "Autonomous Crawler · 3 items", tone: "warning" as Tone },
    { title: "Seal pending export", detail: "Research Automator · approval required", tone: "critical" as Tone },
    { title: "Resume delivery lane", detail: "Stripe outbound queue", tone: "healthy" as Tone },
    { title: "Re-issue tool token", detail: "Support Router · access denied", tone: "warning" as Tone },
  ];

  const queuePoints = Array.from({ length: 16 }, (_, index) =>
    Number((22 + index * 1.4 + Math.sin((index + tick) / 2.1) * 3).toFixed(2)),
  );

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar label="Runs" detail="Execution throughput, failure triage, and recovery decisions">
        <SectionPill label="187 / 24h" tone="focus" />
        <SectionPill label="94.7% success" tone="healthy" />
      </SectionIntroBar>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:overflow-hidden">
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,1fr)_minmax(0,0.95fr)] lg:overflow-hidden">
          <SurfacePanel title="Active Run Board" meta="current load">
            <RecordStack
              items={runItems.map((item, index) => ({
                ...item,
                meta: `${item.detail} · ${relativeStamp(2 + index * 5 + tick)}`,
              }))}
            />
          </SurfacePanel>
          <SurfacePanel title="Recovery Queue" meta="operator attention">
            <RecordStack
              items={recoveryItems.map((item, index) => ({
                ...item,
                meta: `${item.detail} · ${relativeStamp(6 + index * 7 + tick)}`,
              }))}
            />
          </SurfacePanel>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.86fr)_minmax(0,1fr)] lg:overflow-hidden">
          <SurfacePanel title="Queue Pressure" meta="load trend">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard metric={{ label: "Live", value: `${86 + (tick % 9)}`, meta: "active runs", tone: "healthy" }} />
                <MetricCard metric={{ label: "Pressure", value: `${38 + ((tick * 2) % 18)}%`, meta: "queue", tone: "warning" }} />
              </div>
              <div className="min-h-0 flex-1 rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Run load</div>
                    <div className="mt-1 text-sm text-white/58">steady with one recovery spike</div>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">last 6h</div>
                </div>
                <div className="mt-3 h-[132px]">
                  <Sparkline points={queuePoints} strokeClassName="stroke-amber-300" fillClassName="fill-amber-400/10" />
                </div>
              </div>
            </div>
          </SurfacePanel>
          <SurfacePanel title="Seal Decisions" meta="governance lane">
            <RecordStack
              items={[
                {
                  title: "Human approval required",
                  detail: "Privileged export requested by research:pricing_eval",
                  meta: `Production · ${relativeStamp(9 + tick)}`,
                  tone: "critical",
                },
                {
                  title: "Guardrail simulate hit",
                  detail: "Tool use matched candidate deny rule but remained inside simulate mode.",
                  meta: `Staging · ${relativeStamp(21 + tick)}`,
                  tone: "focus",
                },
                {
                  title: "Recovery allowed",
                  detail: "Retry budget still inside envelope for crawler:enrichment_batch.",
                  meta: `Development · ${relativeStamp(33 + tick)}`,
                  tone: "healthy",
                },
              ]}
            />
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function EnvironmentsSection({ tick }: { tick: number }) {
  const cards = [
    {
      name: "Production",
      detail: "Dedicated environment, private egress, enforced guardrails",
      tone: "healthy" as Tone,
      stats: ["12 deployments", "86 live runs", "99.96% ready"],
    },
    {
      name: "Staging",
      detail: "Warm promotion lane, candidate policies, replay visibility",
      tone: "focus" as Tone,
      stats: ["7 deployments", "19 live runs", "1 watch item"],
    },
    {
      name: "Development",
      detail: "Sandboxed tools, ephemeral keys, shared gateway contracts",
      tone: "warning" as Tone,
      stats: ["5 sandboxes", "14 live runs", "1 delayed connector"],
    },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar
        label="Environments"
        detail="Isolation boundaries, readiness, network stance, and policy posture"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[168px_minmax(0,1fr)] lg:overflow-hidden">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.name} className="flex flex-col justify-between rounded-[16px] border border-white/[0.06] bg-[#0b1118] p-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[22px] font-semibold tracking-[-0.04em] text-white">{card.name}</div>
                  <StatusBadge label={card.tone === "warning" ? "Watch" : card.tone === "focus" ? "Active" : "OK"} tone={card.tone} />
                </div>
                <div className="mt-2 text-sm leading-6 text-white/58">{card.detail}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30 sm:grid-cols-3">
                {card.stats.map((stat) => (
                  <div key={stat} className="rounded-[12px] border border-white/[0.06] bg-[#0e141c] px-3 py-2 text-center">
                    {stat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:overflow-hidden">
          <SurfacePanel title="Environment Matrix" meta="bounded posture">
            <EnvironmentMatrix
              rows={[
                {
                  label: "Deployments",
                  meta: "versions",
                  cells: [
                    { value: "12 active", detail: "3 rollout lanes", stamp: relativeStamp(2 + tick), tone: "healthy", badge: "OK" },
                    { value: "7 active", detail: "2 candidates", stamp: relativeStamp(7 + tick), tone: "focus", badge: "Active" },
                    { value: "5 sandboxes", detail: "1 debug lane", stamp: relativeStamp(5 + tick), tone: "neutral", badge: "Ready" },
                  ],
                },
                {
                  label: "Policy",
                  meta: "guardrails",
                  cells: [
                    { value: "enforced", detail: "1 block in window", stamp: relativeStamp(11 + tick), tone: "warning", badge: "Watch" },
                    { value: "simulate", detail: "candidate rules", stamp: relativeStamp(16 + tick), tone: "focus", badge: "Active" },
                    { value: "learning", detail: "signal capture", stamp: relativeStamp(9 + tick), tone: "neutral", badge: "Ready" },
                  ],
                },
                {
                  label: "Keys",
                  meta: "secrets",
                  cells: [
                    { value: "14 healthy", detail: "rotation inside SLA", stamp: relativeStamp(18 + tick), tone: "healthy", badge: "OK" },
                    { value: "6 rotated", detail: "staging current", stamp: relativeStamp(22 + tick), tone: "healthy", badge: "OK" },
                    { value: "4 ephemeral", detail: "sandbox scoped", stamp: relativeStamp(7 + tick), tone: "focus", badge: "Active" },
                  ],
                },
                {
                  label: "Health",
                  meta: "readiness",
                  cells: [
                    { value: "99.96%", detail: "ready / healthy", stamp: relativeStamp(1), tone: "healthy", badge: "OK" },
                    { value: "ready", detail: "fleet responsive", stamp: relativeStamp(2), tone: "healthy", badge: "OK" },
                    { value: "warming", detail: "one sandbox boot", stamp: relativeStamp(4), tone: "warning", badge: "Watch" },
                  ],
                },
                {
                  label: "Network",
                  meta: "egress",
                  cells: [
                    { value: "private mesh", detail: "egress pinned", stamp: relativeStamp(3), tone: "healthy", badge: "OK" },
                    { value: "relay armed", detail: "failover ready", stamp: relativeStamp(6), tone: "focus", badge: "Active" },
                    { value: "shared gateway", detail: "fanout enabled", stamp: relativeStamp(5), tone: "neutral", badge: "Ready" },
                  ],
                },
                {
                  label: "Ownership",
                  meta: "operators",
                  cells: [
                    { value: "Revenue Infra", detail: "production owner", stamp: relativeStamp(31 + tick), tone: "focus", badge: "Current" },
                    { value: "Platform", detail: "staging owner", stamp: relativeStamp(43 + tick), tone: "neutral", badge: "Current" },
                    { value: "Developers", detail: "sandbox owner", stamp: relativeStamp(55 + tick), tone: "neutral", badge: "Current" },
                  ],
                },
              ]}
            />
          </SurfacePanel>

          <SurfacePanel title="Readiness Signals" meta="env health">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
              <ProgressRow label="Production readiness" value={96 + (tick % 3)} tone="healthy" />
              <ProgressRow label="Staging readiness" value={88 + (tick % 7)} tone="focus" />
              <ProgressRow label="Development readiness" value={74 + ((tick * 2) % 11)} tone="warning" />
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Dedicated environments</div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Production runs on its own isolated boundary. Staging stays warm for promotion, while development keeps sandboxed tool access and shared gateway defaults.
                </div>
              </div>
            </div>
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function AccessSection({ tick }: { tick: number }) {
  const keys = [
    { title: "platform-ops-prod", detail: "Production operator key · scoped", meta: `last used ${relativeStamp(4 + tick)}`, tone: "healthy" as Tone },
    { title: "stripe-delivery", detail: "Connector signing key · webhook lane", meta: `rotated ${relativeStamp(19 + tick)}`, tone: "focus" as Tone },
    { title: "hubspot-import", detail: "Integration key · sandbox", meta: `rotation due ${relativeStamp(43 + tick)}`, tone: "warning" as Tone },
    { title: "research-export", detail: "Privileged export key · approval required", meta: `blocked ${relativeStamp(11 + tick)}`, tone: "critical" as Tone },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar label="Access" detail="Keys, roles, auth anomalies, and BYOK posture" />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:overflow-hidden">
        <SurfacePanel title="Credential Registry" meta="governed secrets">
          <RecordStack items={keys} />
        </SurfacePanel>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.8fr)_minmax(0,1fr)] lg:overflow-hidden">
          <SurfacePanel title="Auth Anomalies" meta="watch lane">
            <RecordStack
              items={[
                {
                  title: "Repeated failed login",
                  detail: "Three attempts against platform-ops-prod from an untrusted location.",
                  meta: `Operator auth · ${relativeStamp(7 + tick)}`,
                  tone: "warning",
                },
                {
                  title: "Role expansion requested",
                  detail: "Tenant operator requested export permissions outside the default boundary.",
                  meta: `Role change · ${relativeStamp(28 + tick)}`,
                  tone: "critical",
                },
                {
                  title: "BYOK connector active",
                  detail: "Customer-owned model credentials currently serving production traffic.",
                  meta: `Model access · ${relativeStamp(15 + tick)}`,
                  tone: "focus",
                },
              ]}
            />
          </SurfacePanel>
          <SurfacePanel title="Policy Surface" meta="trust defaults">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
              <ProgressRow label="Rotation compliance" value={91} tone="healthy" />
              <ProgressRow label="Least-privilege coverage" value={84} tone="focus" />
              <ProgressRow label="Approval debt" value={29} tone="warning" />
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Role note</div>
                <div className="mt-2 text-sm leading-6 text-white/58">
                  Production export remains human-gated even when the caller owns the agent. That rule is deliberate.
                </div>
              </div>
            </div>
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function ConnectorsSection({ tick }: { tick: number }) {
  const connectors: ConnectorCard[] = [
    { name: "GitHub", detail: "release webhooks · commit metadata", status: "Healthy", tone: "healthy", stamp: relativeStamp(4 + tick) },
    { name: "Stripe", detail: "billing callbacks · outbound queue", status: "Healthy", tone: "healthy", stamp: relativeStamp(2 + tick) },
    { name: "Twilio", detail: "notifications · retry lane armed", status: tick % 4 === 0 ? "Retrying" : "Healthy", tone: tick % 4 === 0 ? "warning" : "focus", stamp: relativeStamp(9 + tick) },
    { name: "HubSpot", detail: "crm projection · owner sync", status: "Delayed", tone: "warning", stamp: relativeStamp(18 + tick) },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar
        label="Connectors"
        detail="Webhook health, delivery retries, and connector contracts"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:overflow-hidden">
        <SurfacePanel title="Connector Grid" meta="delivery posture">
          <ConnectorGrid connectors={connectors} />
        </SurfacePanel>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,1fr)_minmax(0,0.92fr)] lg:overflow-hidden">
          <SurfacePanel title="Delivery Exceptions" meta="retry lane">
            <RecordStack
              items={[
                {
                  title: "HubSpot sync lag detected",
                  detail: "CRM projection trail is 94 seconds behind the rest of the fanout graph.",
                  meta: `connector delay · ${relativeStamp(11 + tick)}`,
                  tone: "warning",
                },
                {
                  title: "Twilio delivery retry",
                  detail: "Outbound notification retried after temporary upstream 429.",
                  meta: `webhook retry · ${relativeStamp(17 + tick)}`,
                  tone: "focus",
                },
                {
                  title: "Stripe lane recovered",
                  detail: "Previous backlog drained and no messages remain in the dead-letter queue.",
                  meta: `delivery recovery · ${relativeStamp(29 + tick)}`,
                  tone: "healthy",
                },
              ]}
            />
          </SurfacePanel>
          <SurfacePanel title="Contracts" meta="shape of integration">
            <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto overscroll-contain">
              <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3 text-sm text-white/58">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Webhook namespaces</div>
                <div className="mt-2">production / staging / development each maintain isolated delivery credentials and retry counters.</div>
              </div>
              <ProgressRow label="Signed deliveries" value={97} tone="healthy" />
              <ProgressRow label="Retry saturation" value={24} tone="warning" />
            </div>
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function AuditSection({ tick }: { tick: number }) {
  const audit: AuditItem[] = [
    { title: "Rotate API key", resource: "External operator credential", actor: "Creator", role: "operator", stamp: relativeStamp(8 + tick) },
    { title: "Deployment promoted", resource: "Sales Ops Assistant v1.4.x", actor: "Release Bot", role: "automation", stamp: relativeStamp(16 + tick) },
    { title: "Webhook updated", resource: "Stripe outbound delivery", actor: "Integrator", role: "platform", stamp: relativeStamp(26 + tick) },
    { title: "Access granted", resource: "Tenant operator role", actor: "Platform Admin", role: "admin", stamp: relativeStamp(44 + tick) },
    { title: "Policy pack attached", resource: "Production environment", actor: "Security", role: "governance", stamp: relativeStamp(51 + tick) },
    { title: "Ownership changed", resource: "Research Automator", actor: "Platform Admin", role: "admin", stamp: relativeStamp(67 + tick) },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar
        label="Audit"
        detail="Structured record of operator and automation changes"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:overflow-hidden">
        <SurfacePanel title="Audit Timeline" meta="governed record">
          <div className="flex h-full min-h-0 flex-col overflow-auto overscroll-contain pr-1">
            {audit.map((item) => (
              <div
                key={`${item.title}-${item.stamp}`}
                className="grid min-h-[78px] grid-cols-1 gap-2 border-b border-white/[0.05] py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_72px] sm:gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-[13px] text-white/56">{item.resource}</div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    {item.role} · {item.actor}
                  </div>
                </div>
                <div className="text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
                  {item.stamp}
                </div>
              </div>
            ))}
          </div>
        </SurfacePanel>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.9fr)_minmax(0,0.9fr)] lg:overflow-hidden">
          <SurfacePanel title="Ownership Changes" meta="recent transfers">
            <RecordStack
              items={[
                {
                  title: "Sales Ops Assistant → Revenue Infra",
                  detail: "ownership updated and production deployment contract transferred cleanly.",
                  meta: `transfer · ${relativeStamp(18 + tick)}`,
                  tone: "focus",
                },
                {
                  title: "Research Automator → Platform",
                  detail: "staging control reassigned before policy-pack upgrade.",
                  meta: `transfer · ${relativeStamp(41 + tick)}`,
                  tone: "neutral",
                },
              ]}
            />
          </SurfacePanel>
          <SurfacePanel title="Policy Record" meta="changed contracts">
            <RecordStack
              items={[
                {
                  title: "Production deny rule attached",
                  detail: "new tool egress deny rule added for billing export lane.",
                  meta: `policy change · ${relativeStamp(9 + tick)}`,
                  tone: "warning",
                },
                {
                  title: "Approval window shortened",
                  detail: "seal timeout reduced from 30m to 15m for privileged runs.",
                  meta: `policy change · ${relativeStamp(27 + tick)}`,
                  tone: "focus",
                },
              ]}
            />
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function UsageSection({ tick }: { tick: number }) {
  const points = Array.from({ length: 20 }, (_, index) =>
    Number((18 + index * 2 + Math.sin((index + tick) / 2.2) * 4.4 + (index > 13 ? (index - 13) * 1.2 : 0)).toFixed(2)),
  );

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar
        label="Usage"
        detail="Separate infra overhead from model spend and queue pressure"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)] lg:overflow-hidden">
        <SurfacePanel title="Spend Split" meta="today">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard metric={{ label: "Infra", value: formatCurrency(1730 + tick * 26), meta: "control plane", tone: "focus" }} />
              <MetricCard metric={{ label: "Model", value: formatCurrency(970 + tick * 18), meta: "BYOK + shared", tone: "warning" }} />
              <MetricCard metric={{ label: "Headroom", value: "57%", meta: "daily budget", tone: "healthy" }} />
            </div>
            <div className="min-h-0 flex-1 rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Usage trend</div>
                  <div className="mt-1 text-sm text-white/58">infra spend rising slower than model spend</div>
                </div>
                <div className="text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">last 12h</div>
              </div>
              <div className="mt-4 h-[184px]">
                <Sparkline points={points} />
              </div>
            </div>
          </div>
        </SurfacePanel>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-visible lg:grid-rows-[minmax(0,0.86fr)_minmax(0,1fr)] lg:overflow-hidden">
          <SurfacePanel title="Budget Posture" meta="thresholds">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
              <ProgressRow label="Daily infra budget" value={43} tone="healthy" />
              <ProgressRow label="Daily model budget" value={78} tone="warning" />
              <ProgressRow label="Queue saturation" value={38 + ((tick * 3) % 21)} tone="focus" />
              <ProgressRow label="Run retry budget" value={24} tone="healthy" />
            </div>
          </SurfacePanel>
          <SurfacePanel title="Capacity Notes" meta="operating pressure">
            <RecordStack
              items={[
                {
                  title: "Model spend climbing faster than infra",
                  detail: "Customer BYOK lanes are absorbing most of the day-over-day increase.",
                  meta: `usage note · ${relativeStamp(11 + tick)}`,
                  tone: "warning",
                },
                {
                  title: "Queue pressure stable",
                  detail: "No evidence of runaway orchestration despite the latest deployment promotion.",
                  meta: `capacity note · ${relativeStamp(27 + tick)}`,
                  tone: "healthy",
                },
              ]}
            />
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ tick }: { tick: number }) {
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-visible lg:h-full lg:overflow-hidden">
      <SectionIntroBar
        label="Settings"
        detail="Control-plane defaults, policy packs, and runtime knobs"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-visible lg:grid-cols-2 lg:overflow-hidden">
        <SurfacePanel title="Policy Packs" meta="runtime defaults">
          <RecordStack
            items={[
              {
                title: "Production guardrails",
                detail: "deny external side effects without approval, require scoped credentials, retain audit.",
                meta: `enforced · ${relativeStamp(31 + tick)}`,
                tone: "healthy",
              },
              {
                title: "Staging simulate rules",
                detail: "capture policy hit-rate before promotion into enforced mode.",
                meta: `simulate · ${relativeStamp(22 + tick)}`,
                tone: "focus",
              },
            ]}
          />
        </SurfacePanel>
        <SurfacePanel title="Environment Defaults" meta="topology">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
            <ProgressRow label="Dedicated environment coverage" value={41} tone="focus" />
            <ProgressRow label="Webhook isolation" value={92} tone="healthy" />
            <ProgressRow label="Manual approval fallback" value={100} tone="healthy" />
            <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Operator note</div>
              <div className="mt-2 text-sm leading-6 text-white/58">
                Production promotion requires scoped credentials, readiness probes, and an open rollback window before traffic can shift.
              </div>
            </div>
          </div>
        </SurfacePanel>
        <SurfacePanel title="Notification Rules" meta="signal routing">
          <RecordStack
            items={[
              {
                title: "Critical incidents → on-call",
                detail: "policy blocks, production outage, or auth anomaly with severity red.",
                meta: `routing · ${relativeStamp(17 + tick)}`,
                tone: "critical",
              },
              {
                title: "Warnings → operator inbox",
                detail: "connector lag, retry pressure, budget threshold, and warming replicas.",
                meta: `routing · ${relativeStamp(26 + tick)}`,
                tone: "warning",
              },
            ]}
          />
        </SurfacePanel>
        <SurfacePanel title="Runtime Contracts" meta="operator defaults">
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overscroll-contain">
            <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Deployment boundary</div>
              <div className="mt-2 text-sm leading-6 text-white/58">
                Production requires signed releases, bounded egress, and healthy probes before promotion.
              </div>
            </div>
            <div className="rounded-[14px] border border-white/[0.06] bg-[#0e141c] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">Connector posture</div>
              <div className="mt-2 text-sm leading-6 text-white/58">
                Signed webhook delivery, retry isolation, and audit retention stay enabled across every environment.
              </div>
            </div>
          </div>
        </SurfacePanel>
      </div>
    </div>
  );
}

function PlaceholderSection({ section, tick }: { section: DemoSection; tick: number }) {
  if (section === "access") {
    return <AccessSection tick={tick} />;
  }

  if (section === "connectors") {
    return <ConnectorsSection tick={tick} />;
  }

  if (section === "audit") {
    return <AuditSection tick={tick} />;
  }

  if (section === "usage") {
    return <UsageSection tick={tick} />;
  }

  if (section === "settings") {
    return <SettingsSection tick={tick} />;
  }

  return null;
}

export function MutxDemoApp({ section }: { section: DemoSection }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const signals = rotate(BASE_SIGNALS, tick).map((signal, index) => ({
    ...signal,
    stamp: relativeStamp(1 + index * 8 + ((tick + index) % 4)),
  }));
  const auditItems: AuditItem[] = [
    { title: "Rotate API key", resource: "External operator credential", actor: "Creator", role: "operator", stamp: relativeStamp(8 + (tick % 4)) },
    { title: "Deployment promoted", resource: "Sales Ops Assistant v1.4.x", actor: "Release Bot", role: "automation", stamp: relativeStamp(16 + (tick % 5)) },
    { title: "Webhook updated", resource: "Stripe outbound delivery", actor: "Integrator", role: "platform", stamp: relativeStamp(26 + (tick % 6)) },
  ];
  const activeAction = tick % QUICK_ACTIONS.length;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#05090f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,91,124,0.16),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(9,118,141,0.11),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/[0.055] bg-[#070c12]">
          <div className="lg:hidden">
            <div className="flex h-14 items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-transparent-v2.png"
                  alt="MUTX"
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
                  priority
                />
                <div>
                  <div className="text-[16px] font-semibold tracking-[0.14em] text-white">MUTX</div>
                  <div className="text-[10px] font-medium tracking-[0.12em] text-white/42">Control plane</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,108,129,0.18),rgba(7,81,99,0.18))] px-3 text-sm font-medium text-cyan-50"
                >
                  Deploy
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
                >
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 pb-3">
              <SearchBar />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden h-14 grid-cols-[224px_minmax(0,1fr)] lg:grid xl:grid-cols-[232px_minmax(0,1fr)]">
            <div className="flex items-center gap-3 border-r border-white/[0.055] px-4">
              <Image
                src="/logo-transparent-v2.png"
                alt="MUTX"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
                priority
              />
              <div>
                <div className="text-[17px] font-semibold tracking-[0.15em] text-white">MUTX</div>
                <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/42">control plane</div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 px-3">
              <SearchBar />
              <div className="hidden items-center gap-2 xl:flex">
                <TopControl label="Acme Corp" icon={GitBranch} compact />
                <TopControl label="Production" icon={Globe} compact />
                <TopControl label="Last 24h" icon={Clock3} compact />
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,108,129,0.18),rgba(7,81,99,0.18))] px-4 text-sm font-medium text-cyan-50"
                >
                  Deploy Agent
                </button>
              </div>
              <div className="ml-auto hidden items-center gap-2 xl:flex">
                {[Bell, CreditCard, Settings2].map((Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[12px] border border-white/[0.055] bg-[#0d131a] text-white/44"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.055] bg-[#070c12] px-2.5 py-2 lg:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.key === section;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-[12px] border px-3 text-[13px] transition",
                    active
                      ? "border-cyan-400/12 bg-[#102130] text-white"
                      : "border-transparent bg-white/[0.02] text-white/60",
                  )}
                >
                  <item.icon className={cn("h-4 w-4", active ? "text-cyan-200" : "text-white/38")} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[224px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_264px] 2xl:grid-cols-[240px_minmax(0,1fr)_272px]">
          <aside className="hidden min-h-0 flex-col border-r border-white/[0.055] bg-[#060b11] lg:flex">
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3">
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = item.key === section;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-[12px] border px-3 text-[14px] transition",
                        active
                          ? "border-cyan-400/10 bg-[#102130] text-white"
                          : "border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", active ? "text-cyan-200" : "text-white/38")} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] p-3">
              <div className="rounded-[12px] border border-white/[0.055] bg-[#0a1016] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/34">MUTX CLI</div>
                  <div className="rounded-full border border-white/[0.055] bg-[#0f151d] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/42">
                    user@flux
                  </div>
                </div>
                <div className="mt-2 text-[12px] leading-5 text-white/52">
                  Operate rollouts, access, and control-plane state from the same contract.
                </div>
              </div>
              <div className="rounded-[12px] border border-white/[0.055] bg-[#0a1016] p-3">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">
                  <span>PYTEE</span>
                  <StatusBadge label="Online" tone="healthy" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px] text-white/56">
                  <span>SE Milan</span>
                  <span>H1N</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto overflow-x-hidden bg-[#070c12] p-2 lg:overflow-hidden">
            <div className="flex min-h-full flex-col lg:h-full lg:overflow-hidden">
              <div className="min-h-0 flex-1 overflow-visible lg:overflow-hidden">
                {section === "overview" ? (
                  <OverviewSection
                    tick={tick}
                    signals={signals}
                    auditItems={auditItems}
                    activeAction={activeAction}
                  />
                ) : null}
                {section === "agents" ? <AgentsSection tick={tick} /> : null}
                {section === "deployments" ? <DeploymentsSection tick={tick} /> : null}
                {section === "runs" ? <RunsSection tick={tick} /> : null}
                {section === "environments" ? <EnvironmentsSection tick={tick} /> : null}
                {section === "access" || section === "connectors" || section === "audit" || section === "usage" || section === "settings" ? (
                  <PlaceholderSection section={section} tick={tick} />
                ) : null}
              </div>
            </div>
          </main>

          <aside className="hidden min-h-0 overflow-hidden border-l border-white/[0.055] bg-[#060b11] p-2 xl:block">
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,0.94fr)_minmax(0,0.62fr)_auto] gap-2.5 overflow-hidden">
              <RailSection title="Live Signals" meta={`${signals.length} items`}>
                <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto overscroll-contain pr-1">
                  {signals.map((signal) => (
                    <div key={`${signal.title}-${signal.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <SignalToneIcon tone={signal.tone} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-[13px] font-semibold text-white">{signal.title}</div>
                            <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">
                              {signal.stamp}
                            </div>
                          </div>
                          <div className="mt-1 overflow-hidden text-[12px] leading-5 text-white/56 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                            {signal.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RailSection>

              <RailSection title="Audit Trail" meta="operator actions">
                <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto overscroll-contain pr-1">
                  {auditItems.map((item) => (
                    <div key={`${item.title}-${item.stamp}`} className="rounded-[12px] border border-white/[0.04] bg-[#0d131a] p-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-[12px] text-white/56">{item.resource}</div>
                          <div className="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">
                            {item.role} · {item.actor}
                          </div>
                        </div>
                        <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/28">{item.stamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </RailSection>

              <RailSection title="Quick Actions" meta="operator controls">
                <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-auto overscroll-contain">
                  {QUICK_ACTIONS.map((action, index) => (
                    <QuickActionButton key={action.label} action={action} active={index === activeAction} />
                  ))}
                </div>
              </RailSection>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
