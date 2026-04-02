"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Cpu,
  GitBranch,
  HardDrive,
  MoreHorizontal,
  RefreshCcw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "healthy" | "warning" | "critical" | "neutral" | "focus";

type MatrixCell = {
  summary: string;
  detail: string;
  timestamp: string;
  tone: Tone;
};

type MatrixRow = {
  label: string;
  supporting: string;
  cells: MatrixCell[];
};

type DeploymentRow = {
  agent: string;
  runtime: string;
  environment: string;
  version: string;
  region: string;
  replicas: number;
  health: string;
  tone: Tone;
  rollout: string;
};

type FeedItem = {
  title: string;
  detail: string;
  stamp: string;
  tone: Tone;
};

type GovernanceItem = {
  title: string;
  detail: string;
  meta: string;
  tone: Tone;
};

type ConnectorItem = {
  name: string;
  status: string;
  detail: string;
  stamp: string;
  tone: Tone;
};

type AuditItem = {
  title: string;
  resource: string;
  actor: string;
  stamp: string;
};

type QuickAction = {
  label: string;
  detail: string;
};

const ENVIRONMENT_COLUMNS = ["Production", "Staging", "Development"] as const;

const BASE_FEED: FeedItem[] = [
  {
    title: "Deployment succeeded",
    detail: "Sales Ops Assistant rolled out to Production on OpenClaw with zero dropped runs.",
    stamp: "30s ago",
    tone: "healthy",
  },
  {
    title: "Webhook retry succeeded",
    detail: "Stripe delivery recovered after a transient 502 and resumed the outbound queue.",
    stamp: "2m ago",
    tone: "healthy",
  },
  {
    title: "Policy block",
    detail: "Unauthorized tool action stopped in Production before egress left the tenant boundary.",
    stamp: "10m ago",
    tone: "warning",
  },
  {
    title: "Self-healing restart",
    detail: "Research Automator restarted a hot replica and returned to ready in 17 seconds.",
    stamp: "20m ago",
    tone: "healthy",
  },
  {
    title: "API key rotated",
    detail: "External operator credential rotated for Access without invalidating active webhooks.",
    stamp: "43m ago",
    tone: "focus",
  },
  {
    title: "Environment provisioned",
    detail: "Development environment carved out with its own policy set and webhook namespace.",
    stamp: "57m ago",
    tone: "focus",
  },
  {
    title: "Run recovered",
    detail: "Autonomous Crawler retried a failed batch and drained the queue back under threshold.",
    stamp: "1h ago",
    tone: "healthy",
  },
  {
    title: "Budget threshold near",
    detail: "Model spend crossed 78% of the daily envelope; infra spend remains inside target.",
    stamp: "1h ago",
    tone: "warning",
  },
  {
    title: "Connector delay",
    detail: "HubSpot sync is lagging behind the rest of the delivery fanout by 94 seconds.",
    stamp: "2h ago",
    tone: "warning",
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Deploy New Version",
    detail: "Promote Production",
  },
  {
    label: "Rotate Key",
    detail: "Access Surface",
  },
  {
    label: "Inspect Failed Run",
    detail: "Open Recovery",
  },
  {
    label: "Provision Environment",
    detail: "Create Isolated Space",
  },
  {
    label: "Create Webhook",
    detail: "Connector Contract",
  },
  {
    label: "Open Audit Export",
    detail: "Download Timeline",
  },
];

const FILTERS = [
  { label: "Agents", icon: Bot },
  { label: "Acme Corp", icon: GitBranch },
  { label: "Last 24h", icon: Activity },
  { label: "Priority", icon: ShieldCheck },
] as const;

function toneClasses(tone: Tone) {
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
      return "border-[#26384b] bg-[#0d1520] text-slate-300";
  }
}

function toneDot(tone: Tone) {
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
      return "bg-slate-500";
  }
}

function toneText(tone: Tone) {
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
      return "text-slate-300";
  }
}

function rotateList<T>(items: T[], amount: number) {
  if (items.length === 0) return items;
  const offset = ((amount % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function relativeStamp(baseMinutes: number) {
  if (baseMinutes < 60) {
    return `${baseMinutes}m ago`;
  }

  const hours = Math.floor(baseMinutes / 60);
  const minutes = baseMinutes % 60;
  if (minutes === 0) {
    return `${hours}h ago`;
  }

  return `${hours}h ${minutes}m ago`;
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
  const line = buildPath(points, width, height);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function DemoPanel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[#1d2b3b] bg-[linear-gradient(180deg,rgba(13,18,27,0.96)_0%,rgba(7,11,18,0.98)_100%)] shadow-[0_18px_60px_rgba(1,6,16,0.32)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(173,194,219,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(173,194,219,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative border-b border-[#182434] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[1.02rem] font-semibold text-slate-50">{title}</h3>
          {meta ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{meta}</span>
          ) : null}
        </div>
      </div>
      <div className="relative p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DemoBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium", toneClasses(tone))}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot(tone))} />
      {label}
    </span>
  );
}

function EventIcon({ tone }: { tone: Tone }) {
  if (tone === "healthy") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (tone === "warning") return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  if (tone === "critical") return <ShieldAlert className="h-4 w-4 text-rose-300" />;
  if (tone === "focus") return <RefreshCcw className="h-4 w-4 text-cyan-300" />;
  return <Activity className="h-4 w-4 text-slate-300" />;
}

function QuickActionButton({ action, active }: { action: QuickAction; active: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all",
        active
          ? "border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(103,232,249,0.06)]"
          : "border-[#1c2d40] bg-[#0b141f]/90 hover:border-[#29405c] hover:bg-[#0e1723]",
      )}
    >
      <div>
        <p className="text-sm font-medium text-slate-100">{action.label}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{action.detail}</p>
      </div>
      <ArrowUpRight className={cn("h-4 w-4 transition-colors", active ? "text-cyan-200" : "text-slate-500 group-hover:text-slate-300")} />
    </button>
  );
}

export function MutxOverviewDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const matrixRows = useMemo<MatrixRow[]>(() => {
    const cycle = tick % 6;
    return [
      {
        label: "Deployments",
        supporting: "runtime mix",
        cells: [
          {
            summary: `${12 + (tick % 2)} active`,
            detail: "OpenClaw + LangChain",
            timestamp: relativeStamp(3 + cycle),
            tone: "healthy",
          },
          {
            summary: `${7 + ((tick + 1) % 2)} active`,
            detail: "candidate rollouts",
            timestamp: relativeStamp(6 + cycle),
            tone: "focus",
          },
          {
            summary: `${5 + (tick % 3)} sandboxes`,
            detail: "n8n + OpenClaw",
            timestamp: relativeStamp(2 + cycle),
            tone: "neutral",
          },
        ],
      },
      {
        label: "Active Runs",
        supporting: "queue pressure",
        cells: [
          {
            summary: `${86 + (tick % 7)} live`,
            detail: "queue steady",
            timestamp: relativeStamp(1),
            tone: "healthy",
          },
          {
            summary: `${19 + (tick % 4)} live`,
            detail: "replay window",
            timestamp: relativeStamp(4),
            tone: cycle === 2 ? "warning" : "focus",
          },
          {
            summary: `${14 + (tick % 5)} live`,
            detail: "bursting",
            timestamp: relativeStamp(2),
            tone: cycle === 4 ? "warning" : "neutral",
          },
        ],
      },
      {
        label: "Policy State",
        supporting: "guardrails",
        cells: [
          {
            summary: cycle === 3 ? "2 blocks" : "1 block",
            detail: "tool egress denied",
            timestamp: relativeStamp(10 + cycle),
            tone: "warning",
          },
          {
            summary: "simulate mode",
            detail: "candidate rules",
            timestamp: relativeStamp(12 + cycle),
            tone: "focus",
          },
          {
            summary: "learning",
            detail: "signal capture",
            timestamp: relativeStamp(6 + cycle),
            tone: "neutral",
          },
        ],
      },
      {
        label: "Keys / Secrets",
        supporting: "access hygiene",
        cells: [
          {
            summary: `${14 + (tick % 2)} healthy`,
            detail: cycle === 1 ? "1 rotation due" : "all rotations inside window",
            timestamp: relativeStamp(8 + cycle),
            tone: cycle === 1 ? "warning" : "healthy",
          },
          {
            summary: "6 rotated",
            detail: "staged credentials current",
            timestamp: relativeStamp(18 + cycle),
            tone: "healthy",
          },
          {
            summary: "4 ephemeral",
            detail: "sandbox scoped",
            timestamp: relativeStamp(5 + cycle),
            tone: "focus",
          },
        ],
      },
      {
        label: "Network",
        supporting: "traffic posture",
        cells: [
          {
            summary: "private mesh",
            detail: "egress pinned",
            timestamp: relativeStamp(1 + cycle),
            tone: "healthy",
          },
          {
            summary: "relay warm",
            detail: "regional failover armed",
            timestamp: relativeStamp(7 + cycle),
            tone: "focus",
          },
          {
            summary: "shared gateway",
            detail: "tool fanout enabled",
            timestamp: relativeStamp(3 + cycle),
            tone: "neutral",
          },
        ],
      },
      {
        label: "Health",
        supporting: "readiness",
        cells: [
          {
            summary: `${(99.94 + Math.sin(tick / 3) * 0.03).toFixed(2)}%`,
            detail: "ready / healthy",
            timestamp: relativeStamp(1),
            tone: "healthy",
          },
          {
            summary: cycle === 5 ? "warming" : "ready",
            detail: cycle === 5 ? "one replica catching up" : "fleet responsive",
            timestamp: relativeStamp(2 + cycle),
            tone: cycle === 5 ? "warning" : "healthy",
          },
          {
            summary: "ready",
            detail: "sandbox probes green",
            timestamp: relativeStamp(1 + cycle),
            tone: "healthy",
          },
        ],
      },
    ];
  }, [tick]);

  const kpis = useMemo(
    () => [
      {
        label: "Agents",
        value: `${56 + (tick % 3)}`,
        detail: "operator fleet",
        tone: "focus" as Tone,
      },
      {
        label: "Deployments",
        value: `${24 + (tick % 2)}`,
        detail: "active versions",
        tone: "neutral" as Tone,
      },
      {
        label: "Runs (24h)",
        value: `${187 + ((tick * 7) % 18)}`,
        detail: "throughput",
        tone: "healthy" as Tone,
      },
      {
        label: "Success Rate",
        value: `${(94.7 + Math.sin(tick / 2.5) * 0.5).toFixed(1)}%`,
        detail: "completed recoveries",
        tone: "focus" as Tone,
      },
      {
        label: "Infra Cost",
        value: formatCurrency(2.3 + ((tick % 5) * 0.2)),
        detail: "today",
        tone: "focus" as Tone,
      },
      {
        label: "Incidents",
        value: `${2 + (tick % 2)}`,
        detail: "guardrails + delivery",
        tone: tick % 4 === 0 ? ("warning" as Tone) : ("neutral" as Tone),
      },
    ],
    [tick],
  );

  const deploymentRows = useMemo<DeploymentRow[]>(
    () => [
      {
        agent: "Sales Ops Assistant",
        runtime: "OpenClaw",
        environment: "Production",
        version: `v1.4.${tick % 2}`,
        region: "EU-West",
        replicas: 3 + (tick % 2),
        health: "Healthy",
        tone: "healthy",
        rollout: relativeStamp(5 + (tick % 4)),
      },
      {
        agent: "Data Processor",
        runtime: "LangChain",
        environment: "Staging",
        version: "v1.6.1",
        region: "US-East",
        replicas: 2 + ((tick + 1) % 2),
        health: tick % 5 === 0 ? "Policy Watch" : "Healthy",
        tone: tick % 5 === 0 ? "warning" : "healthy",
        rollout: relativeStamp(12 + (tick % 6)),
      },
      {
        agent: "Autonomous Crawler",
        runtime: "n8n",
        environment: "Development",
        version: `v0.9.${2 + (tick % 3)}`,
        region: "EU-West",
        replicas: 1,
        health: "Healthy",
        tone: "healthy",
        rollout: relativeStamp(43 + (tick % 9)),
      },
      {
        agent: "Research Automator",
        runtime: "OpenClaw",
        environment: "Production",
        version: "v2.0.4",
        region: "US-West",
        replicas: 4 + (tick % 2),
        health: tick % 6 === 3 ? "Self-healing" : "Healthy",
        tone: tick % 6 === 3 ? "focus" : "healthy",
        rollout: relativeStamp(28 + (tick % 7)),
      },
    ],
    [tick],
  );

  const governanceItems = useMemo<GovernanceItem[]>(
    () => [
      {
        title: "Policy block: Unauthorized tool action",
        detail: "Outbound connector call stopped before external side effects escaped the control plane.",
        meta: `Production · ${relativeStamp(2 + (tick % 4))}`,
        tone: "warning",
      },
      {
        title: "Seal decision: Human approval required",
        detail: "A privileged run requested data export outside the owner boundary and was held for review.",
        meta: `Staging · ${relativeStamp(11 + (tick % 6))}`,
        tone: tick % 3 === 0 ? "critical" : "warning",
      },
      {
        title: "API key hygiene",
        detail: "One external operator credential is nearing rotation threshold and has not been used in 6 days.",
        meta: `Access · ${relativeStamp(34 + (tick % 10))}`,
        tone: tick % 4 === 1 ? "warning" : "focus",
      },
      {
        title: "Ownership change recorded",
        detail: "Sales Ops Assistant ownership transferred from Platform to Revenue Infra with audit capture intact.",
        meta: `Audit · ${relativeStamp(48 + (tick % 8))}`,
        tone: "focus",
      },
    ],
    [tick],
  );

  const feedItems = useMemo(() => {
    return rotateList(BASE_FEED, tick).map((item, index) => ({
      ...item,
      stamp: relativeStamp(1 + index * 7 + ((tick + index) % 5)),
    }));
  }, [tick]);

  const connectors = useMemo<ConnectorItem[]>(
    () => [
      {
        name: "GitHub",
        status: tick % 4 === 0 ? "Watching retries" : "Healthy",
        detail: "Deploy hooks and release metadata",
        stamp: relativeStamp(3 + (tick % 4)),
        tone: tick % 4 === 0 ? "warning" : "healthy",
      },
      {
        name: "Stripe",
        status: "Healthy",
        detail: "Billing events on governed fanout",
        stamp: relativeStamp(1 + (tick % 3)),
        tone: "healthy",
      },
      {
        name: "Twilio",
        status: tick % 5 === 2 ? "Retrying" : "Healthy",
        detail: "Outbound comms webhook delivery",
        stamp: relativeStamp(2 + (tick % 5)),
        tone: tick % 5 === 2 ? "warning" : "healthy",
      },
      {
        name: "HubSpot",
        status: tick % 6 === 1 ? "Delayed" : "Healthy",
        detail: "CRM sync and ownership projection",
        stamp: relativeStamp(12 + (tick % 6)),
        tone: tick % 6 === 1 ? "warning" : "focus",
      },
    ],
    [tick],
  );

  const auditItems = useMemo<AuditItem[]>(
    () => [
      {
        title: "Rotate API key",
        resource: "External operator credential",
        actor: "Creator",
        stamp: relativeStamp(8 + (tick % 4)),
      },
      {
        title: "Deployment promoted",
        resource: "Sales Ops Assistant v1.4.x",
        actor: "Release Bot",
        stamp: relativeStamp(16 + (tick % 5)),
      },
      {
        title: "Webhook updated",
        resource: "Stripe outbound delivery",
        actor: "Integrator",
        stamp: relativeStamp(26 + (tick % 6)),
      },
      {
        title: "Access granted",
        resource: "Tenant operator role",
        actor: "Platform Admin",
        stamp: relativeStamp(44 + (tick % 10)),
      },
    ],
    [tick],
  );

  const costSeries = useMemo(() => {
    return Array.from({ length: 18 }, (_, index) => {
      const base = 18 + index * 1.8;
      const wave = Math.sin((index + tick) / 2.6) * 4.2;
      const lateLift = index > 11 ? (index - 11) * 1.3 : 0;
      return Number((base + wave + lateLift).toFixed(2));
    });
  }, [tick]);

  const linePath = useMemo(() => buildPath(costSeries, 520, 150), [costSeries]);
  const areaPath = useMemo(() => buildArea(costSeries, 520, 150), [costSeries]);

  const infraSpend = useMemo(() => formatCurrency(1730 + tick * 26), [tick]);
  const modelSpend = useMemo(() => formatCurrency(970 + tick * 18), [tick]);
  const queuePressure = useMemo(() => `${38 + ((tick * 3) % 21)}%`, [tick]);
  const activeAction = tick % QUICK_ACTIONS.length;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[28px] border border-[#1f3043] bg-[linear-gradient(180deg,rgba(13,19,28,0.98)_0%,rgba(7,10,15,0.99)_100%)] p-4 shadow-[0_28px_90px_rgba(1,6,16,0.34)] sm:p-5"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.14),transparent_32%),radial-gradient(circle_at_65%_20%,rgba(125,211,252,0.14),transparent_20%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(173,194,219,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(173,194,219,0.14)_1px,transparent_1px)] [background-size:54px_54px]" />
          <div className="relative flex flex-wrap items-center gap-3">
            {FILTERS.map(({ label, icon: Icon }, index) => (
              <button
                key={label}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                  index === (tick % FILTERS.length)
                    ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
                    : "border-[#223447] bg-[#09111b]/90 text-slate-300 hover:border-[#334d67]",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>
            ))}
            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <DemoBadge tone="healthy" label="Live Preview" />
              <DemoBadge tone="focus" label="BYOK Ready" />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#223447] bg-[#09111b]/90 px-3 py-2 text-sm text-slate-300"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative mt-5 rounded-[24px] border border-[#1a2736] bg-[radial-gradient(circle_at_top,rgba(170,197,222,0.14),transparent_35%),linear-gradient(180deg,rgba(15,20,29,0.96)_0%,rgba(9,13,20,0.98)_100%)] p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.32)_0.7px,transparent_0.8px)] [background-size:18px_18px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.8),transparent_96%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo-transparent-v2.png"
                      alt="MUTX"
                      width={46}
                      height={46}
                      className="h-11 w-11 object-contain"
                      priority
                    />
                    <span className="text-[1.85rem] font-semibold tracking-[0.28em] text-slate-50">MUTX</span>
                  </div>
                  <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50 sm:text-[2.35rem]">
                    Environment Matrix
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                    Control-plane awareness across deployment boundaries, guarded access, connector health, and operator interventions.
                    This demo surface behaves like a live command center without binding to production APIs.
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#223447] bg-[#0b121b]/90 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Change Window</p>
                    <p className="mt-2 font-medium text-slate-100">Governed rollout lane active</p>
                  </div>
                  <div className="rounded-2xl border border-[#223447] bg-[#0b121b]/90 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Ownership</p>
                    <p className="mt-2 font-medium text-slate-100">Acme Corp / Revenue Infra</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                {kpis.map((kpi, index) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.35 }}
                    className={cn(
                      "relative overflow-hidden rounded-[18px] border px-4 py-4",
                      kpi.tone === "healthy"
                        ? "border-emerald-400/16 bg-emerald-400/[0.08]"
                        : kpi.tone === "warning"
                          ? "border-amber-400/16 bg-amber-400/[0.08]"
                          : kpi.tone === "focus"
                            ? "border-cyan-400/18 bg-cyan-400/[0.08]"
                            : "border-[#233447] bg-[#0c131d]/90",
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70" />
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{kpi.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-3xl font-semibold tracking-tight text-slate-50">{kpi.value}</p>
                      <span className={cn("text-xs font-medium", toneText(kpi.tone))}>{kpi.detail}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[920px] overflow-hidden rounded-[22px] border border-[#1d2b3b]">
                  <div className="grid grid-cols-[220px_repeat(3,minmax(0,1fr))] bg-[#0d141e]">
                    <div className="border-r border-[#1b2937] px-4 py-4" />
                    {ENVIRONMENT_COLUMNS.map((environment) => (
                      <div key={environment} className="border-r border-[#1b2937] px-4 py-4 last:border-r-0">
                        <p className="text-lg font-medium text-slate-50">{environment}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">control lane</p>
                      </div>
                    ))}
                  </div>

                  {matrixRows.map((row, rowIndex) => (
                    <div
                      key={row.label}
                      className={cn(
                        "grid grid-cols-[220px_repeat(3,minmax(0,1fr))] border-t border-[#162230] bg-[#0a1118]/95 transition-colors",
                        rowIndex === tick % matrixRows.length ? "bg-cyan-400/[0.03]" : "",
                      )}
                    >
                      <div className="border-r border-[#1b2937] px-4 py-4">
                        <p className="text-sm font-medium text-slate-100">{row.label}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{row.supporting}</p>
                      </div>
                      {row.cells.map((cell, cellIndex) => (
                        <div key={`${row.label}-${cellIndex}`} className="border-r border-[#1b2937] px-4 py-4 last:border-r-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-50">{cell.summary}</p>
                              <p className="mt-1 text-xs text-slate-400">{cell.detail}</p>
                            </div>
                            <DemoBadge tone={cell.tone} label={cell.tone === "warning" ? "Watch" : cell.tone === "focus" ? "Active" : "OK"} />
                          </div>
                          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">{cell.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-5 xl:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="xl:col-span-7"
          >
            <DemoPanel title="Active Deployments" meta="fleet surface">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-[#172434] text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      {["Agent", "Runtime", "Environment", "Version", "Region", "Replicas", "Health", "Last Rollout"].map((heading) => (
                        <th key={heading} className="px-3 py-3 font-medium">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deploymentRows.map((row, index) => (
                      <tr key={row.agent} className={cn("border-b border-[#111c28] text-sm", index === 0 ? "bg-cyan-400/[0.02]" : "")}>
                        <td className="px-3 py-4 text-slate-100">{row.agent}</td>
                        <td className="px-3 py-4 text-slate-300">{row.runtime}</td>
                        <td className="px-3 py-4 text-slate-300">{row.environment}</td>
                        <td className="px-3 py-4 text-slate-300">{row.version}</td>
                        <td className="px-3 py-4 text-slate-300">{row.region}</td>
                        <td className="px-3 py-4 text-slate-300">{row.replicas}</td>
                        <td className="px-3 py-4">
                          <DemoBadge tone={row.tone} label={row.health} />
                        </td>
                        <td className="px-3 py-4 text-slate-400">{row.rollout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DemoPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="xl:col-span-5"
          >
            <DemoPanel title="Cost & Capacity" meta="infra vs model">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#1c2d40] bg-[#0b141f]/90 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Server className="h-4 w-4 text-cyan-300" />
                    <span className="text-[11px] uppercase tracking-[0.18em]">Infra Spend</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-50">{infraSpend}</p>
                  <p className="mt-1 text-xs text-slate-500">Control-plane, queueing, and environment overhead</p>
                </div>
                <div className="rounded-2xl border border-[#1c2d40] bg-[#0b141f]/90 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Zap className="h-4 w-4 text-amber-300" />
                    <span className="text-[11px] uppercase tracking-[0.18em]">Model Spend</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-50">{modelSpend}</p>
                  <p className="mt-1 text-xs text-slate-500">Separated BYOK consumption envelope</p>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-[#1c2d40] bg-[#0a1119]/95 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Budget Ridge</p>
                    <p className="mt-1 text-sm text-slate-300">Queue pressure {queuePressure}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DemoBadge tone="healthy" label={`${(57 + (tick % 9)).toString()}% budget headroom`} />
                    <DemoBadge tone="focus" label={`${(63 + (tick % 12)).toString()} req/s`} />
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-[#142131] bg-[#081019] p-3">
                  <svg viewBox="0 0 520 150" className="h-[160px] w-full">
                    <defs>
                      <linearGradient id="mutx-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(125,211,252,0.30)" />
                        <stop offset="100%" stopColor="rgba(125,211,252,0.02)" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#mutx-area)" />
                    <path d={linePath} fill="none" stroke="#84d8ff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#162536] bg-[#09111b] px-3 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Cpu className="h-4 w-4 text-cyan-300" />
                      <span className="text-[11px] uppercase tracking-[0.18em]">CPU</span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-50">{55 + (tick % 18)}%</p>
                  </div>
                  <div className="rounded-xl border border-[#162536] bg-[#09111b] px-3 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <HardDrive className="h-4 w-4 text-cyan-300" />
                      <span className="text-[11px] uppercase tracking-[0.18em]">Memory</span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-50">{47 + ((tick * 2) % 22)}%</p>
                  </div>
                </div>
              </div>
            </DemoPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.35 }}
            className="xl:col-span-7"
          >
            <DemoPanel title="Guardrails & Governance" meta="policy posture">
              <div className="space-y-3">
                {governanceItems.map((item, index) => (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-2xl border px-4 py-4 transition-all",
                      index === tick % governanceItems.length ? "border-cyan-400/22 bg-cyan-400/[0.06]" : "border-[#182739] bg-[#0a131d]/90",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", toneDot(item.tone))} />
                          <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                      </div>
                      <DemoBadge tone={item.tone} label={item.meta} />
                    </div>
                  </div>
                ))}
              </div>
            </DemoPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="xl:col-span-5"
          >
            <DemoPanel title="Connectors & Webhooks" meta="delivery plane">
              <div className="grid gap-3 sm:grid-cols-2">
                {connectors.map((connector, index) => (
                  <div
                    key={connector.name}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      index === tick % connectors.length ? "border-cyan-400/22 bg-cyan-400/[0.06]" : "border-[#1c2d40] bg-[#0a131d]/90",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-slate-100">{connector.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{connector.detail}</p>
                      </div>
                      <DemoBadge tone={connector.tone} label={connector.status} />
                    </div>
                    <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">{connector.stamp}</p>
                  </div>
                ))}
              </div>
            </DemoPanel>
          </motion.div>
        </div>
      </div>

      <div className="space-y-5">
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="space-y-5"
        >
          <DemoPanel title="Live Event Feed" meta="rotating signals" className="sticky top-0">
            <div className="space-y-3">
              {feedItems.map((item, index) => (
                <motion.div
                  key={`${item.title}-${index}-${tick}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="rounded-2xl border border-[#182739] bg-[#0a131d]/90 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border", toneClasses(item.tone))}>
                      <EventIcon tone={item.tone} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">{item.title}</p>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.stamp}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </DemoPanel>

          <DemoPanel title="Audit Trail" meta="operator actions">
            <div className="space-y-3">
              {auditItems.map((item, index) => (
                <div key={item.title} className={cn("rounded-2xl border px-4 py-4", index === tick % auditItems.length ? "border-cyan-400/22 bg-cyan-400/[0.05]" : "border-[#182739] bg-[#0a131d]/90")}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{item.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.stamp}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.resource}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.actor}</p>
                </div>
              ))}
            </div>
          </DemoPanel>

          <DemoPanel title="Quick Actions" meta="operator controls">
            <div className="space-y-3">
              {QUICK_ACTIONS.map((action, index) => (
                <QuickActionButton key={action.label} action={action} active={index === activeAction} />
              ))}
            </div>
          </DemoPanel>
        </motion.aside>
      </div>
    </div>
  );
}
