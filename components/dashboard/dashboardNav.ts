import {
  Activity,
  BellRing,
  Bot,
  BrainCircuit,
  Building2,
  Clock3,
  Github,
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
  group: "core" | "observe" | "automate" | "admin";
}

export interface DashboardNavGroup {
  key: DashboardNavItem["group"];
  title?: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Gateway control posture",
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
    title: "Tasks",
    description: "Execution queue and runs",
    href: "/dashboard/runs",
    icon: History,
    group: "core",
  },
  {
    title: "Chat",
    description: "Operator controls",
    href: "/dashboard/control",
    icon: MessageCircle,
    group: "core",
  },
  {
    title: "Channels",
    description: "Trace and channel flow",
    href: "/dashboard/traces",
    icon: MessagesSquare,
    group: "core",
  },
  {
    title: "Skills",
    description: "Spawn and capability lanes",
    href: "/dashboard/spawn",
    icon: Sparkles,
    group: "core",
  },
  {
    title: "Memory",
    description: "Reserved memory surface",
    href: "/dashboard/memory",
    icon: BrainCircuit,
    group: "core",
  },
  {
    title: "Activity",
    description: "Historical operator activity",
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
    title: "Cost Tracker",
    description: "Usage and budget signals",
    href: "/dashboard/budgets",
    icon: Wallet,
    group: "observe",
  },
  {
    title: "Nodes",
    description: "Deployment topology",
    href: "/dashboard/deployments",
    icon: Layers,
    group: "observe",
  },
  {
    title: "Approvals",
    description: "API access governance",
    href: "/dashboard/api-keys",
    icon: KeyRound,
    group: "observe",
  },
  {
    title: "Office",
    description: "Analytics workbench",
    href: "/dashboard/analytics",
    icon: Building2,
    group: "observe",
  },
  {
    title: "Cron",
    description: "Workflow automation lanes",
    href: "/dashboard/orchestration",
    icon: Clock3,
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
    title: "Alerts",
    description: "Health and alert posture",
    href: "/dashboard/monitoring",
    icon: BellRing,
    group: "automate",
  },
  {
    title: "GitHub",
    description: "Swarm-linked operations",
    href: "/dashboard/swarm",
    icon: Github,
    group: "automate",
  },
  {
    title: "Security",
    description: "Control-plane hardening",
    href: "/dashboard/control",
    icon: ShieldCheck,
    group: "admin",
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
  {
    key: "admin",
    title: "Admin",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "admin"),
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
