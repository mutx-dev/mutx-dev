import {
  Bot,
  BellRing,
  BarChart3,
  History,
  KeyRound,
  Layers,
  Settings2,
  ShieldCheck,
  Wallet,
  Webhook,
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
    title: "Environments",
    description: "View environment posture and readiness",
    href: "/dashboard/monitoring",
    publicHref: "/environments",
    icon: BellRing,
    group: "control",
  },
  {
    title: "Access",
    description: "Manage auth, API keys, and BYOK access",
    href: "/dashboard/api-keys",
    publicHref: "/access",
    icon: KeyRound,
    group: "control",
  },
  {
    title: "Connectors",
    description: "Monitor webhooks and external integrations",
    href: "/dashboard/webhooks",
    publicHref: "/connectors",
    icon: Webhook,
    group: "control",
  },
  {
    title: "Audit",
    description: "Review operator actions and fleet changes",
    href: "/dashboard/history",
    publicHref: "/audit",
    icon: History,
    group: "control",
  },
  {
    title: "Usage",
    description: "Split infra and model cost posture",
    href: "/dashboard/budgets",
    publicHref: "/usage",
    icon: Wallet,
    group: "control",
  },
  {
    title: "Settings",
    description: "Configure control-plane policy and preferences",
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
