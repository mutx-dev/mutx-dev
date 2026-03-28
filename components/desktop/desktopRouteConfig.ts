import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BellRing,
  Bot,
  Brain,
  GitBranchPlus,
  History,
  KeyRound,
  Layers,
  ListTree,
  MemoryStick,
  MessagesSquare,
  Network,
  Radar,
  ShieldCheck,
  TerminalSquare,
  Users,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";

export type DesktopRouteSection = "home" | "core" | "execution" | "admin" | "support";
export type DesktopRouteStage = "stable" | "preview" | "redirect";

export type DesktopRouteKey =
  | "home"
  | "agents"
  | "deployments"
  | "runs"
  | "monitoring"
  | "traces"
  | "observability"
  | "sessions"
  | "apiKeys"
  | "budgets"
  | "webhooks"
  | "swarm"
  | "security"
  | "orchestration"
  | "memory"
  | "analytics"
  | "channels"
  | "history"
  | "skills"
  | "spawn"
  | "logs"
  | "control";

export interface DesktopRouteMeta {
  key: DesktopRouteKey;
  title: string;
  path: string;
  publicHref: string;
  description: string;
  badge: string;
  section: DesktopRouteSection;
  icon: LucideIcon;
  iconTone: string;
  stage?: DesktopRouteStage;
  showInPrimaryNav?: boolean;
  requiresAuth?: boolean;
  requiresAssistant?: boolean;
}

export const DESKTOP_ROUTE_META: Record<DesktopRouteKey, DesktopRouteMeta> = {
  home: {
    key: "home",
    title: "Overview",
    path: "/dashboard",
    publicHref: "/",
    description: "Native mission control for desktop identity, runtime posture, and operator actions.",
    badge: "mission control",
    section: "home",
    icon: Activity,
    iconTone: "text-cyan-300 bg-cyan-400/10",
  },
  agents: {
    key: "agents",
    title: "Agents",
    path: "/dashboard/agents",
    publicHref: "/agents",
    description: "Desktop-native registry for assistants, lifecycle control, and fleet ownership.",
    badge: "core ops",
    section: "core",
    icon: Bot,
    iconTone: "text-cyan-300 bg-cyan-400/10",
    requiresAuth: true,
  },
  deployments: {
    key: "deployments",
    title: "Deployments",
    path: "/dashboard/deployments",
    publicHref: "/deployments",
    description: "Rollout posture, replica control, and runtime-aware deployment recovery.",
    badge: "core ops",
    section: "core",
    icon: Layers,
    iconTone: "text-emerald-300 bg-emerald-400/10",
    requiresAuth: true,
  },
  runs: {
    key: "runs",
    title: "Runs",
    path: "/dashboard/runs",
    publicHref: "/runs",
    description: "Recent execution history with direct machine-local follow-up actions.",
    badge: "core ops",
    section: "core",
    icon: History,
    iconTone: "text-cyan-300 bg-cyan-400/10",
    requiresAuth: true,
  },
  monitoring: {
    key: "monitoring",
    title: "Monitoring",
    path: "/dashboard/monitoring",
    publicHref: "/environments",
    description: "Alert pressure, gateway health, governance state, and operator-visible runtime condition.",
    badge: "core ops",
    section: "core",
    icon: BellRing,
    iconTone: "text-sky-300 bg-sky-400/10",
    requiresAuth: true,
  },
  traces: {
    key: "traces",
    title: "Traces",
    path: "/dashboard/traces",
    publicHref: "/runs",
    description: "Trace exploration tied to real runs and machine-aware debugging context.",
    badge: "execution",
    section: "execution",
    icon: Workflow,
    iconTone: "text-sky-300 bg-sky-400/10",
    requiresAuth: true,
  },
  observability: {
    key: "observability",
    title: "Observability",
    path: "/dashboard/observability",
    publicHref: "/observability",
    description: "Desktop-native event and telemetry surface over the live observability contracts.",
    badge: "execution",
    section: "execution",
    icon: Radar,
    iconTone: "text-emerald-300 bg-emerald-400/10",
    requiresAuth: true,
  },
  sessions: {
    key: "sessions",
    title: "Sessions",
    path: "/dashboard/sessions",
    publicHref: "/sessions",
    description: "Local and cloud session activity in one native operator surface.",
    badge: "execution",
    section: "execution",
    icon: Users,
    iconTone: "text-cyan-300 bg-cyan-400/10",
    requiresAuth: true,
    requiresAssistant: true,
  },
  apiKeys: {
    key: "apiKeys",
    title: "API Keys",
    path: "/dashboard/api-keys",
    publicHref: "/api-keys",
    description: "Native key issuance, rotation, revocation, and one-time secret handling.",
    badge: "admin",
    section: "admin",
    icon: KeyRound,
    iconTone: "text-amber-300 bg-amber-400/10",
    requiresAuth: true,
  },
  budgets: {
    key: "budgets",
    title: "Budgets",
    path: "/dashboard/budgets",
    publicHref: "/usage",
    description: "Usage, credit posture, and cost signals with local runtime context nearby.",
    badge: "admin",
    section: "admin",
    icon: Wallet,
    iconTone: "text-emerald-300 bg-emerald-400/10",
    requiresAuth: true,
  },
  webhooks: {
    key: "webhooks",
    title: "Webhooks",
    path: "/dashboard/webhooks",
    publicHref: "/connectors",
    description: "Outbound delivery endpoints and test flows without leaving the desktop shell.",
    badge: "admin",
    section: "admin",
    icon: Webhook,
    iconTone: "text-fuchsia-300 bg-fuchsia-400/10",
    requiresAuth: true,
  },
  swarm: {
    key: "swarm",
    title: "Swarm",
    path: "/dashboard/swarm",
    publicHref: "/deployments",
    description: "Grouped agent topology and scaling posture with native runtime context.",
    badge: "support",
    section: "support",
    icon: GitBranchPlus,
    iconTone: "text-cyan-300 bg-cyan-400/10",
    requiresAuth: true,
  },
  security: {
    key: "security",
    title: "Security",
    path: "/dashboard/security",
    publicHref: "/access",
    description: "Operator session posture, token state, key inventory, and trust boundaries.",
    badge: "admin",
    section: "admin",
    icon: ShieldCheck,
    iconTone: "text-amber-300 bg-amber-400/10",
    requiresAuth: true,
  },
  orchestration: {
    key: "orchestration",
    title: "Orchestration",
    path: "/dashboard/orchestration",
    publicHref: "/settings",
    description: "Workflow lanes, automation posture, and native desktop orchestration context.",
    badge: "admin",
    section: "admin",
    icon: Network,
    iconTone: "text-sky-300 bg-sky-400/10",
    stage: "preview",
    showInPrimaryNav: false,
    requiresAuth: true,
  },
  memory: {
    key: "memory",
    title: "Memory",
    path: "/dashboard/memory",
    publicHref: "/settings",
    description: "Context retention posture, workspace memory readiness, and future memory controls.",
    badge: "admin",
    section: "admin",
    icon: MemoryStick,
    iconTone: "text-violet-300 bg-violet-400/10",
    stage: "preview",
    showInPrimaryNav: false,
    requiresAuth: true,
  },
  analytics: {
    key: "analytics",
    title: "Analytics",
    path: "/dashboard/analytics",
    publicHref: "/analytics",
    description: "Trends, latency, and fleet activity summaries rendered in the native shell.",
    badge: "admin",
    section: "admin",
    icon: BarChart3,
    iconTone: "text-fuchsia-300 bg-fuchsia-400/10",
    requiresAuth: true,
  },
  channels: {
    key: "channels",
    title: "Channels",
    path: "/dashboard/channels",
    publicHref: "/settings",
    description: "Channel posture, assistant bindings, and local communication defaults.",
    badge: "support",
    section: "support",
    icon: MessagesSquare,
    iconTone: "text-cyan-300 bg-cyan-400/10",
    stage: "preview",
    showInPrimaryNav: false,
    requiresAuth: true,
    requiresAssistant: true,
  },
  history: {
    key: "history",
    title: "History",
    path: "/dashboard/history",
    publicHref: "/environments",
    description: "Native audit trail entrypoint for recent operator actions and local recovery context.",
    badge: "support",
    section: "support",
    icon: History,
    iconTone: "text-slate-200 bg-white/10",
    stage: "redirect",
    showInPrimaryNav: false,
    requiresAuth: true,
  },
  skills: {
    key: "skills",
    title: "Skills",
    path: "/dashboard/skills",
    publicHref: "/settings",
    description: "Installed assistant capabilities and native workspace skill posture.",
    badge: "support",
    section: "support",
    icon: Brain,
    iconTone: "text-sky-300 bg-sky-400/10",
    stage: "preview",
    showInPrimaryNav: false,
    requiresAuth: true,
    requiresAssistant: true,
  },
  spawn: {
    key: "spawn",
    title: "Spawn",
    path: "/dashboard/spawn",
    publicHref: "/agents",
    description: "Native entrypoint for creating new assistants and local operator seat expansion.",
    badge: "support",
    section: "support",
    icon: ListTree,
    iconTone: "text-emerald-300 bg-emerald-400/10",
    stage: "redirect",
    showInPrimaryNav: false,
    requiresAuth: true,
  },
  logs: {
    key: "logs",
    title: "Logs",
    path: "/dashboard/logs",
    publicHref: "/environments",
    description: "Machine-aware log posture for runtime, governance, and recent failures.",
    badge: "support",
    section: "support",
    icon: TerminalSquare,
    iconTone: "text-slate-200 bg-white/10",
    stage: "redirect",
    showInPrimaryNav: false,
    requiresAuth: true,
  },
  control: {
    key: "control",
    title: "Advanced",
    path: "/dashboard/control",
    publicHref: "/settings",
    description: "Bridge diagnostics, runtime repair, governance control, and desktop environment inspection.",
    badge: "advanced diagnostics",
    section: "support",
    icon: Activity,
    iconTone: "text-cyan-300 bg-cyan-400/10",
  },
};

export const DESKTOP_ROUTE_ORDER: DesktopRouteKey[] = [
  "home",
  "agents",
  "deployments",
  "runs",
  "monitoring",
  "traces",
  "observability",
  "sessions",
  "apiKeys",
  "budgets",
  "analytics",
  "webhooks",
  "security",
  "orchestration",
  "memory",
  "swarm",
  "channels",
  "history",
  "skills",
  "spawn",
  "logs",
  "control",
];

export const PRIMARY_DESKTOP_ROUTE_ORDER: DesktopRouteKey[] = DESKTOP_ROUTE_ORDER.filter(
  (key) => DESKTOP_ROUTE_META[key].showInPrimaryNav !== false,
);

const DESKTOP_ROUTE_PATH_TO_KEY = Object.values(DESKTOP_ROUTE_META).reduce<Record<string, DesktopRouteKey>>(
  (accumulator, meta) => {
    accumulator[meta.path] = meta.key;
    return accumulator;
  },
  {},
);

export function getDesktopRouteKeyForPath(pathname: string | null | undefined): DesktopRouteKey {
  if (!pathname) {
    return "home";
  }

  return DESKTOP_ROUTE_PATH_TO_KEY[pathname] || "home";
}
