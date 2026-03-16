import {
  Activity,
  ArrowRight,
  Bot,
  Command,
  Key,
  Layers,
  LogOut,
  Rocket,
  ShieldCheck,
  Users,
  BarChart3,
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
    title: "Spawn",
    description: "Create and configure agents",
    href: "/dashboard/spawn",
    icon: Bot,
  },
  {
    title: "Control",
    description: "Control plane operations",
    href: "/dashboard/control",
    icon: Command,
  },
  {
    title: "Monitoring",
    description: "Usage and health telemetry",
    href: "/dashboard/monitoring",
    icon: Activity,
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
    icon: LogOut,
  },
  {
    title: "History",
    description: "Execution timeline",
    href: "/dashboard/history",
    icon: ArrowRight,
  },
  {
    title: "Deployments",
    description: "Manage agent deployments",
    href: "/dashboard/deployments",
    icon: Layers,
  },
  {
    title: "API Keys",
    description: "Manage API access keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
