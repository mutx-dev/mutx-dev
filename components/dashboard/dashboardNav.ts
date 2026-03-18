import {
  Activity,
  BarChart3,
  Bot,
  History,
  Key,
  Layers,
  Network,
  ShieldCheck,
  TerminalSquare,
  Wallet,
  Webhook,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "core" | "operations";
}

export interface DashboardNavGroup {
  key: DashboardNavItem["group"];
  title: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Fleet summary and health",
    href: "/dashboard",
    icon: ShieldCheck,
    group: "core",
  },
  {
    title: "Agents",
    description: "Manage your agent fleet",
    href: "/dashboard/agents",
    icon: Bot,
    group: "core",
  },
  {
    title: "Deployments",
    description: "Operate running deployments",
    href: "/dashboard/deployments",
    icon: Layers,
    group: "core",
  },
  {
    title: "Webhooks",
    description: "Configure event delivery",
    href: "/dashboard/webhooks",
    icon: Webhook,
    group: "core",
  },
  {
    title: "API Keys",
    description: "Manage API access",
    href: "/dashboard/api-keys",
    icon: Key,
    group: "core",
  },
  {
    title: "Monitoring",
    description: "Health and telemetry",
    href: "/dashboard/monitoring",
    icon: Activity,
    group: "core",
  },
  {
    title: "Analytics",
    description: "Usage trends and insights",
    href: "/dashboard/analytics",
    icon: BarChart3,
    group: "core",
  },
  {
    title: "Spawn",
    description: "Create new agents",
    href: "/dashboard/spawn",
    icon: Bot,
    group: "core",
  },
  {
    title: "Runs",
    description: "Execution timeline",
    href: "/dashboard/runs",
    icon: History,
    group: "operations",
  },
  {
    title: "Traces",
    description: "Execution drill-down",
    href: "/dashboard/traces",
    icon: Network,
    group: "operations",
  },
  {
    title: "Logs",
    description: "Inspect runtime output",
    href: "/dashboard/logs",
    icon: TerminalSquare,
    group: "operations",
  },
  {
    title: "Orchestration",
    description: "Workflow lane topology",
    href: "/dashboard/orchestration",
    icon: Workflow,
    group: "operations",
  },
  {
    title: "Budgets",
    description: "Spend and quota posture",
    href: "/dashboard/budgets",
    icon: Wallet,
    group: "operations",
  },
];

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    key: "core",
    title: "Core surfaces",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "core"),
  },
  {
    key: "operations",
    title: "Operator workflows",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "operations"),
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
