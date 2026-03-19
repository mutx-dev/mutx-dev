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
    title: "Runs",
    description: "Execution history and outcomes",
    href: "/dashboard/runs",
    icon: History,
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
    title: "Traces",
    description: "Trace and runtime detail",
    href: "/dashboard/traces",
    icon: MessagesSquare,
    group: "core",
  },
  {
    title: "Provisioning",
    description: "Spawn new operator workflows",
    href: "/dashboard/spawn",
    icon: Sparkles,
    group: "core",
  },
  {
    title: "Memory",
    description: "Operator memory surface",
    href: "/dashboard/memory",
    icon: BrainCircuit,
    group: "core",
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
    title: "Deployments",
    description: "Deployment inventory and topology",
    href: "/dashboard/deployments",
    icon: Layers,
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
    icon: Building2,
    group: "observe",
  },
  {
    title: "Orchestration",
    description: "Automation lanes",
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
    title: "Monitoring",
    description: "Health and readiness posture",
    href: "/dashboard/monitoring",
    icon: BellRing,
    group: "automate",
  },
  {
    title: "Swarm",
    description: "GitHub-linked swarm operations",
    href: "/dashboard/swarm",
    icon: Github,
    group: "automate",
  },
  {
    title: "Security",
    description: "Security and hardening",
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
