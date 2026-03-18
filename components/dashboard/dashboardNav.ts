import {
  Activity,
  BarChart3,
  Bot,
  Key,
  Layers,
  ShieldCheck,
  Users,
  Webhook,
  TerminalSquare,
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
    description: "Fleet summary and health",
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
    title: "Deployments",
    description: "Operate running deployments",
    href: "/dashboard/deployments",
    icon: Layers,
  },
  {
    title: "Webhooks",
    description: "Configure event delivery",
    href: "/dashboard/webhooks",
    icon: Webhook,
  },
  {
    title: "API Keys",
    description: "Manage API access",
    href: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "Logs",
    description: "Inspect runtime output",
    href: "/dashboard/logs",
    icon: TerminalSquare,
  },
  {
    title: "Monitoring",
    description: "Health and telemetry",
    href: "/dashboard/monitoring",
    icon: Activity,
  },
  {
    title: "Analytics",
    description: "Usage trends and insights",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Spawn",
    description: "Create new agents",
    href: "/dashboard/spawn",
    icon: Bot,
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
