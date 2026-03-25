import {
  Bot,
  BellRing,
  History,
  GitBranchPlus,
  Layers,
  Network,
  Settings2,
  ShieldCheck,
  Wallet,
  Webhook,
  Workflow,
  Key,
  BarChart3,
  Activity,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardNavItem {
  title: string;
  description: string;
  href: string;
  publicHref: string;
  icon: LucideIcon;
  group: "control" | "system";
}

export interface DashboardNavGroup {
  key: DashboardNavItem["group"];
  title?: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Overview",
    description: "Command center for MUTX operator surfaces",
    href: "/dashboard",
    publicHref: "/",
    icon: ShieldCheck,
    group: "control",
  },
  {
    title: "Agents",
    description: "Manage agent inventory",
    href: "/dashboard/agents",
    publicHref: "/agents",
    icon: Bot,
    group: "control",
  },
  {
    title: "Deployments",
    description: "Track deployed versions and fleet posture",
    href: "/dashboard/deployments",
    publicHref: "/deployments",
    icon: Layers,
    group: "control",
  },
  {
    title: "Runs",
    description: "Inspect recent execution activity",
    href: "/dashboard/runs",
    publicHref: "/runs",
    icon: History,
    group: "control",
  },
  {
    title: "Traces",
    description: "Inspect correlated execution traces",
    href: "/dashboard/traces",
    publicHref: "/runs",
    icon: Workflow,
    group: "control",
  },
  {
    title: "Monitoring",
    description: "View health posture and alert pressure",
    href: "/dashboard/monitoring",
    publicHref: "/environments",
    icon: BellRing,
    group: "control",
  },
  {
    title: "Observability",
    description: "Agent run observability and metrics",
    href: "/dashboard/observability",
    publicHref: "/observability",
    icon: Activity,
    group: "control",
  },
  {
    title: "Analytics",
    description: "Usage analytics and trends",
    href: "/dashboard/analytics",
    publicHref: "/analytics",
    icon: BarChart3,
    group: "control",
  },
  {
    title: "Sessions",
    description: "Active sessions and connections",
    href: "/dashboard/sessions",
    publicHref: "/sessions",
    icon: Users,
    group: "control",
  },
  {
    title: "API Keys",
    description: "Manage API keys and access tokens",
    href: "/dashboard/api-keys",
    publicHref: "/api-keys",
    icon: Key,
    group: "system",
  },
  {
    title: "Budgets",
    description: "Split infra and model cost posture",
    href: "/dashboard/budgets",
    publicHref: "/usage",
    icon: Wallet,
    group: "control",
  },
  {
    title: "Webhooks",
    description: "Monitor webhooks and external integrations",
    href: "/dashboard/webhooks",
    publicHref: "/connectors",
    icon: Webhook,
    group: "control",
  },
  {
    title: "Swarm",
    description: "Grouped agent topology and scaling posture",
    href: "/dashboard/swarm",
    publicHref: "/deployments",
    icon: GitBranchPlus,
    group: "control",
  },
  {
    title: "Security",
    description: "Manage auth, API keys, and access posture",
    href: "/dashboard/security",
    publicHref: "/access",
    icon: ShieldCheck,
    group: "system",
  },
  {
    title: "Orchestration",
    description: "Workflow and automation lanes",
    href: "/dashboard/orchestration",
    publicHref: "/settings",
    icon: Network,
    group: "system",
  },
  {
    title: "Memory",
    description: "Future context and retention control",
    href: "/dashboard/memory",
    publicHref: "/settings",
    icon: Wallet,
    group: "system",
  },
  {
    title: "Control",
    description: "Setup and platform defaults",
    href: "/dashboard/control",
    publicHref: "/settings",
    icon: Settings2,
    group: "system",
  },
];

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    key: "control",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "control"),
  },
  {
    key: "system",
    title: "System",
    items: DASHBOARD_NAV_ITEMS.filter((item) => item.group === "system"),
  },
];

function normalizePathname(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getDashboardNavHref(pathname: string, item: DashboardNavItem): string {
  const normalizedPath = normalizePathname(pathname);
  const usesInternalDashboardPath =
    normalizedPath === "/dashboard" ||
    normalizedPath.startsWith("/dashboard/") ||
    normalizedPath === "/app" ||
    normalizedPath.startsWith("/app/");

  return usesInternalDashboardPath ? item.href : item.publicHref;
}

export function isDashboardNavItemActive(pathname: string, item: DashboardNavItem): boolean {
  const normalizedPath = normalizePathname(pathname);
  const activeRoots = [item.href, item.publicHref].map(normalizePathname);

  if (activeRoots.includes("/dashboard") || activeRoots.includes("/")) {
    return normalizedPath === "/" || normalizedPath === "/dashboard" || normalizedPath === "/overview";
  }

  return activeRoots.some((root) => normalizedPath === root || normalizedPath.startsWith(`${root}/`));
}
