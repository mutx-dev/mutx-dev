export const DEMO_SECTIONS = [
  "overview",
  "agents",
  "deployments",
  "runs",
  "environments",
  "access",
  "connectors",
  "audit",
  "usage",
  "settings",
] as const;

export type DemoSection = (typeof DEMO_SECTIONS)[number];

export function isDemoSection(value: string): value is DemoSection {
  return DEMO_SECTIONS.includes(value as DemoSection);
}

const DEMO_SECTION_DASHBOARD_HREFS: Record<DemoSection, string> = {
  overview: "/dashboard",
  agents: "/dashboard/agents",
  deployments: "/dashboard/deployments",
  runs: "/dashboard/runs",
  environments: "/dashboard/monitoring",
  access: "/dashboard/security",
  connectors: "/dashboard/webhooks",
  audit: "/dashboard/history",
  usage: "/dashboard/budgets",
  settings: "/dashboard/control",
};

export function getDemoSectionHref(section: DemoSection) {
  return DEMO_SECTION_DASHBOARD_HREFS[section];
}
