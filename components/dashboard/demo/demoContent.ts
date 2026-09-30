import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Globe,
  KeyRound,
  Layers3,
  Play,
  Settings2,
  ShieldCheck,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";

import {
  getDemoSectionHref,
  type DemoSection,
} from "@/components/dashboard/demo/demoSections";

export type Tone = "healthy" | "warning" | "critical" | "focus" | "neutral";

export type DemoNavItem = {
  key: DemoSection;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type DemoHeroStat = {
  label: string;
  value: string;
  detail: string;
};

export type DemoSectionMeta = {
  eyebrow: string;
  title: string;
  detail: string;
  heroStats: DemoHeroStat[];
  command: string;
  narrative: string[];
};

export type Metric = {
  label: string;
  value: string;
  meta: string;
  tone?: Tone;
};

export type QuickAction = {
  label: string;
  detail: string;
};

export const NAV_ITEMS: DemoNavItem[] = [
  { key: "overview", label: "Overview", href: getDemoSectionHref("overview"), icon: ShieldCheck },
  { key: "agents", label: "Agents", href: getDemoSectionHref("agents"), icon: Bot },
  { key: "deployments", label: "Deployments", href: getDemoSectionHref("deployments"), icon: Layers3 },
  { key: "runs", label: "Runs", href: getDemoSectionHref("runs"), icon: Play },
  { key: "environments", label: "Environments", href: getDemoSectionHref("environments"), icon: Globe },
  { key: "access", label: "Access", href: getDemoSectionHref("access"), icon: KeyRound },
  { key: "connectors", label: "Connectors", href: getDemoSectionHref("connectors"), icon: Webhook },
  { key: "audit", label: "Audit", href: getDemoSectionHref("audit"), icon: Workflow },
  { key: "usage", label: "Usage", href: getDemoSectionHref("usage"), icon: Wallet },
  { key: "settings", label: "Settings", href: getDemoSectionHref("settings"), icon: Settings2 },
];

export const SECTION_META: Record<DemoSection, DemoSectionMeta> = {
  overview: {
    eyebrow: "Overview",
    title: "Run review",
    detail: "Follow agent activity, inspect a run, and review a tool call with its context in view.",
    heroStats: [],
    command: "Start with the selected run, then show how its tool request reaches an operator decision.",
    narrative: [
      "The agent submitted a request to compare three vendor proposals.",
      "The run searched its connected documents before preparing a summary.",
      "Sharing the summary outside the workspace needs an operator review.",
    ],
  },
  agents: {
    eyebrow: "Agents",
    title: "Agents",
    detail: "See each agent’s role, environment, and current state in one readable list.",
    heroStats: [
      { label: "Agents", value: "12", detail: "across the workspace" },
      { label: "Ready", value: "09", detail: "available now" },
      { label: "Needs attention", value: "01", detail: "review the agent record" },
    ],
    command: "Use the agent list to connect each workload with an owner and an environment.",
    narrative: [
      "Each agent has a named role and a bounded environment.",
      "A clear state helps the operator decide what to inspect next.",
      "Records make agent ownership and state easy to review.",
    ],
  },
  deployments: {
    eyebrow: "Deployments",
    title: "Deployments",
    detail: "Review the version, environment, and rollout state before promoting a change.",
    heroStats: [
      { label: "Deployments", value: "08", detail: "across the workspace" },
      { label: "Ready", value: "06", detail: "within workspace policy" },
      { label: "In review", value: "01", detail: "promotion needs attention" },
    ],
    command: "Compare the current release with the version and environment it will change.",
    narrative: [
      "The current version is visible beside its target environment.",
      "A review state keeps promotion decisions easy to spot.",
      "Open a deployment record to understand the change before acting.",
    ],
  },
  runs: {
    eyebrow: "Runs",
    title: "Runs",
    detail: "Trace an agent request from its first event through each tool call and review.",
    heroStats: [
      { label: "Runs today", value: "28", detail: "recorded today" },
      { label: "Completed", value: "24", detail: "completed today" },
      { label: "Awaiting review", value: "01", detail: "tool call needs a decision" },
    ],
    command: "Follow the selected run from request to tool call, then review the decision it needs.",
    narrative: [
      "A run keeps its request and events together.",
      "The tool and destination are shown before an external action proceeds.",
      "An operator can review the request with the original context beside it.",
    ],
  },
  environments: {
    eyebrow: "Environments",
    title: "Environments",
    detail: "Compare production, staging, and development settings at a glance.",
    heroStats: [
      { label: "Environments", value: "03", detail: "separate operating spaces" },
      { label: "Production", value: "Ready", detail: "approval required for external tools" },
      { label: "Development", value: "Sandbox", detail: "isolated workspace" },
    ],
    command: "Compare each environment’s access and review rules before opening a run.",
    narrative: [
      "Production has stricter review rules than development.",
      "Staging gives a place to check changes before release.",
      "Each environment’s summary makes its boundary visible.",
    ],
  },
  access: {
    eyebrow: "Access",
    title: "Access",
    detail: "Review who and what can reach each connected environment.",
    heroStats: [
      { label: "Access records", value: "06", detail: "across the workspace" },
      { label: "Roles", value: "03", detail: "owner, operator, viewer" },
      { label: "Review needed", value: "01", detail: "credential rotation" },
    ],
    command: "Show the role and scope before reviewing a credential or access change.",
    narrative: [
      "Roles make the person’s level of access clear.",
      "Credentials are shown by purpose without exposing their values.",
      "Rotation history gives the operator a useful review point.",
    ],
  },
  connectors: {
    eyebrow: "Connectors",
    title: "Connectors",
    detail: "See where events and tool requests are sent, and whether delivery needs a look.",
    heroStats: [
      { label: "Connectors", value: "08", detail: "across the workspace" },
      { label: "Delivering", value: "07", detail: "currently ready" },
      { label: "Needs review", value: "01", detail: "check delivery settings" },
    ],
    command: "Open a connector to review its destination, purpose, and delivery state.",
    narrative: [
      "Each connector has a clear destination and purpose.",
      "Delivery state helps focus attention on the records that need review.",
      "Configuration can be checked without losing the event context.",
    ],
  },
  audit: {
    eyebrow: "Audit",
    title: "Audit history",
    detail: "Keep changes, decisions, and their owners together in a readable timeline.",
    heroStats: [
      { label: "Events", value: "18", detail: "in recent history" },
      { label: "Decisions", value: "04", detail: "operator reviews" },
      { label: "Actors", value: "06", detail: "named records" },
    ],
    command: "Use the timeline to connect an operator action with the resource it changed.",
    narrative: [
      "Each entry names the actor and resource.",
      "Decisions sit alongside the event that prompted them.",
      "The history helps operators understand how the current state came to be.",
    ],
  },
  usage: {
    eyebrow: "Usage",
    title: "Usage and spend",
    detail: "Understand how infrastructure and model usage compare with the workspace budget.",
    heroStats: [
      { label: "Infrastructure", value: "$1,730", detail: "monthly spend" },
      { label: "Model usage", value: "$970", detail: "monthly spend" },
      { label: "Budget remaining", value: "57%", detail: "of monthly allowance" },
    ],
    command: "Compare infrastructure and model usage against the same budget window.",
    narrative: [
      "Infrastructure and model usage have separate totals.",
      "The budget bar makes the remaining allowance easy to compare.",
      "Compare current usage with the remaining allowance.",
    ],
  },
  settings: {
    eyebrow: "Settings",
    title: "Workspace settings",
    detail: "Review the default environment, approval rules, and notification preferences.",
    heroStats: [
      { label: "Default environment", value: "Staging", detail: "for new deployments" },
      { label: "External tools", value: "Review", detail: "operator approval required" },
      { label: "Notifications", value: "On", detail: "for decisions and failures" },
    ],
    command: "Review the workspace defaults that shape new runs and deployments.",
    narrative: [
      "New deployments start in the staging environment.",
      "External tool calls can wait for an operator decision.",
      "Decision and failure notifications keep the right events visible.",
    ],
  },
};

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Deploy new version", detail: "Promote rollout" },
  { label: "Rotate key", detail: "Refresh access" },
  { label: "Inspect failed run", detail: "Open recovery" },
  { label: "Provision environment", detail: "Create environment" },
  { label: "Create webhook", detail: "Add connector" },
];
