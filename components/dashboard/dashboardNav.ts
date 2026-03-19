import {
  Activity,
  BellRing,
  Bot,
  BrainCircuit,
  BarChart3,
  History,
  KeyRound,
  Layers,
  MessageCircle,
  MessagesSquare,
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
  group: "core" | "observe" | "automate";
}

export interface DashboardNavGroup {
  key: DashboardNavItem["group"];
  title?: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Control-plane posture",
    href: "/dashboard",
    icon: ShieldCheck,
    group: "core",
  },
  {
    title: "Agents",
    description: "Manage active fleet",
    href: "/dashboard/agents",
    icon: Bot,
    group: "core",
  },
  {
    title: "Deployments",
    description: "Deployment inventory and topology",
    href: "/dashboard/deployments",
    icon: Layers,
    group: "core",
  },
  {
    title: "Runs",
    description: "Execution history and outcomes",
    href: "/dashboard/runs",
    icon: History,
    group: "core",
  },
  {
    title: "Traces",
    description: "Trace and runtime detail",
    href: "/dashboard/traces",
    icon: MessagesSquare,
    group: "core",
  },
  {
    title: "Control",
    description: "Policies and control settings",
    href: "/dashboard/control",
    icon: MessageCircle,
    group: "core",
  },
  {
    title: "Provisioning",
    description: "Create and prepare new operator workflows",
    href: "/dashboard/spawn",
    icon: Sparkles,
    group: "core",
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
    description: "Recent operator activity",
    href: "/dashboard/history",
    icon: Activity,
    group: "observe",
  },
  {
    title: "Logs",
    description: "Runtime log stream",
    href: "/dashboard/logs",
    icon: MessageCircle,
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
    description: "Automation lanes",
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
    title: "Monitoring",
    description: "Health and readiness posture",
    href: "/dashboard/monitoring",
    icon: BellRing,
    group: "automate",
  },
];

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    key: "core",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "core"),
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
