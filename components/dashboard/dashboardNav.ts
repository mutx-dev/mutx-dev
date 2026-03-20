import {
  Activity,
  BellRing,
  Bot,
  BrainCircuit,
  BarChart3,
  Cable,
  History,
  KeyRound,
  Layers,
  MessageCircle,
  MessagesSquare,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wallet,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "orchestrate" | "observe" | "automate";
}

export interface DashboardNavGroup {
  key: DashboardNavItem["group"];
  title?: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Assistant control-plane posture",
    href: "/dashboard",
    icon: ShieldCheck,
    group: "orchestrate",
  },
  {
    title: "Agents",
    description: "Manage assistant-backed agents",
    href: "/dashboard/agents",
    icon: Bot,
    group: "orchestrate",
  },
  {
    title: "Deployments",
    description: "Assistant deployment inventory and topology",
    href: "/dashboard/deployments",
    icon: Layers,
    group: "orchestrate",
  },
  {
    title: "Setup",
    description: "Starter deployment and operator setup lane",
    href: "/dashboard/control",
    icon: Sparkles,
    group: "orchestrate",
  },
  {
    title: "Sessions",
    description: "Active assistant session state",
    href: "/dashboard/sessions",
    icon: Radio,
    group: "orchestrate",
  },
  {
    title: "Skills",
    description: "Assistant workspace and installed skills",
    href: "/dashboard/skills",
    icon: Rocket,
    group: "orchestrate",
  },
  {
    title: "Channels",
    description: "Assistant channel bindings and policy",
    href: "/dashboard/channels",
    icon: Cable,
    group: "orchestrate",
  },
  {
    title: "Memory",
    description: "Operator memory surface",
    href: "/dashboard/memory",
    icon: BrainCircuit,
    group: "observe",
  },
  {
    title: "History",
    description: "Recent assistant and operator activity",
    href: "/dashboard/history",
    icon: Activity,
    group: "observe",
  },
  {
    title: "Logs",
    description: "Assistant runtime log stream",
    href: "/dashboard/logs",
    icon: MessageCircle,
    group: "observe",
  },
  {
    title: "Runs",
    description: "Execution history and outcomes",
    href: "/dashboard/runs",
    icon: History,
    group: "observe",
  },
  {
    title: "Traces",
    description: "Trace and runtime detail",
    href: "/dashboard/traces",
    icon: MessagesSquare,
    group: "observe",
  },
  {
    title: "Budgets",
    description: "Usage and budget posture",
    href: "/dashboard/budgets",
    icon: Wallet,
    group: "observe",
  },
  {
    title: "API Keys",
    description: "Access governance",
    href: "/dashboard/api-keys",
    icon: KeyRound,
    group: "observe",
  },
  {
    title: "Analytics",
    description: "Operational analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    group: "observe",
  },
  {
    title: "Orchestration",
    description: "Automation lanes after starter deployment",
    href: "/dashboard/orchestration",
    icon: Sparkles,
    group: "automate",
  },
  {
    title: "Webhooks",
    description: "Event delivery routes",
    href: "/dashboard/webhooks",
    icon: Webhook,
    group: "automate",
  },
  {
    title: "Health",
    description: "Gateway and readiness posture",
    href: "/dashboard/monitoring",
    icon: BellRing,
    group: "automate",
  },
];

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    key: "orchestrate",
    title: "Orchestrate",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "orchestrate"),
  },
  {
    key: "observe",
    title: "Observe",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "observe"),
  },
  {
    key: "automate",
    title: "Automate",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "automate"),
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
