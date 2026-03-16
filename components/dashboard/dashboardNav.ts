import {
  Activity,
  ArrowRight,
  Bot,
  Command,
  Layers,
  LogOut,
  Rocket,
  ShieldCheck,
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
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
