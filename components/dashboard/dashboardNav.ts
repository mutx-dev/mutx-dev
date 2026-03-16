import {
  Activity,
  BarChart3,
  Bot,
  Cloud,
  Command,
  Database,
  FileSearch,
  History,
  Key,
  Layers,
  Play,
  Rocket,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Fleet summary and agents",
    href: "/dashboard",
    icon: ShieldCheck,
  },
  {
    title: "Agents",
    description: "Manage your agent fleet",
    href: "/dashboard/agents",
    icon: Users,
  },
  {
    title: "Swarm",
    description: "Swarm command and control",
    href: "/dashboard/swarm",
    icon: Cloud,
  },
  {
    title: "Runs",
    description: "Run history and results",
    href: "/dashboard/runs",
    icon: Play,
  },
  {
    title: "Traces",
    description: "Trace explorer and analysis",
    href: "/dashboard/traces",
    icon: FileSearch,
  },
  {
    title: "Memory",
    description: "Memory atlas and storage",
    href: "/dashboard/memory",
    icon: Database,
  },
  {
    title: "Budgets",
    description: "Resource budgets and limits",
    href: "/dashboard/budgets",
    icon: Wallet,
  },
  {
    title: "Spawn",
    description: "Create and configure agents",
    href: "/dashboard/spawn",
    icon: Bot,
  },
  {
    title: "Webhooks",
    description: "Webhook gateway and events",
    href: "/dashboard/webhooks",
    icon: Webhook,
  },
  {
    title: "API Keys",
    description: "Manage API access keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "Monitoring",
    description: "Usage and health telemetry",
    href: "/dashboard/monitoring",
    icon: Activity,
  },
  {
    title: "Control",
    description: "Control plane operations",
    href: "/dashboard/control",
    icon: Command,
  },
  {
    title: "Analytics",
    description: "Usage telemetry and insights",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Orchestration",
    description: "Lane scheduling and flow",
    href: "/dashboard/orchestration",
    icon: Rocket,
  },
  {
    title: "Logs",
    description: "Runtime and system logs",
    href: "/dashboard/logs",
    icon: ScrollText,
  },
  {
    title: "History",
    description: "Execution timeline",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Deployments",
    description: "Manage agent deployments",
    href: "/dashboard/deployments",
    icon: Layers,
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
