import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Globe,
  KeyRound,
  Layers3,
  Play,
  Settings2,
  ShieldCheck,
  Webhook,
  Workflow,
  Wallet,
} from "lucide-react";

import type { DemoSection } from "@/components/dashboard/demo/demoSections";

export type Tone = "healthy" | "warning" | "critical" | "focus" | "neutral";

export type DemoNavItem = {
  key: DemoSection;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type Metric = {
  label: string;
  value: string;
  meta: string;
  tone?: Tone;
};

export type SignalItem = {
  title: string;
  detail: string;
  tone: Tone;
  stamp: string;
};

export type AuditItem = {
  title: string;
  resource: string;
  actor: string;
  role: string;
  stamp: string;
};

export type MatrixCell = {
  value: string;
  detail: string;
  stamp: string;
  tone: Tone;
  badge: string;
};

export type MatrixRow = {
  label: string;
  meta: string;
  cells: MatrixCell[];
};

export type DeploymentRow = {
  agent: string;
  runtime: string;
  environment: string;
  version: string;
  region: string;
  health: string;
  tone: Tone;
  rollout: string;
};

export type AgentCard = {
  name: string;
  role: string;
  model: string;
  env: string;
  status: string;
  tone: Tone;
  lastSeen: string;
  load: string;
};

export type ConnectorCard = {
  name: string;
  detail: string;
  status: string;
  tone: Tone;
  stamp: string;
};

export type QuickAction = {
  label: string;
  detail: string;
};

export const NAV_ITEMS: DemoNavItem[] = [
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

export const SECTION_META: Record<
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

export const BASE_SIGNALS: Array<Omit<SignalItem, "stamp">> = [
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

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Deploy new version", detail: "Promote rollout" },
  { label: "Rotate key", detail: "Refresh access" },
  { label: "Inspect failed run", detail: "Open recovery" },
  { label: "Provision environment", detail: "Create environment" },
  { label: "Create webhook", detail: "Add connector" },
];

export const AGENT_NAMES = [
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

export function relativeStamp(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes}m ago`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h ago` : `${hours}h ${minutes}m ago`;
}

export function rotate<T>(items: T[], offset: number) {
  if (items.length === 0) {
    return items;
  }

  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

export function toneBadgeClasses(tone: Tone) {
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

export function toneTextClasses(tone: Tone) {
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

export function toneDotClasses(tone: Tone) {
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

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 1,
  }).format(value);
}

export function buildPath(points: number[], width: number, height: number) {
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

export function buildArea(points: number[], width: number, height: number) {
  return `${buildPath(points, width, height)} L ${width} ${height} L 0 ${height} Z`;
}
