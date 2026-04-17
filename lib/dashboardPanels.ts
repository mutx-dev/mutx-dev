export const DEFAULT_DASHBOARD_PANEL = 'overview'

export const DASHBOARD_PANEL_ROUTE_MAP = {
  overview: '/dashboard',
  agents: '/dashboard/agents',
  tasks: '/dashboard/orchestration',
  chat: '/dashboard/sessions',
  activity: '/dashboard/history',
  logs: '/dashboard/logs',
  cron: '/dashboard/autonomy',
  memory: '/dashboard/memory',
  skills: '/dashboard/skills',
  settings: '/dashboard/control',
  tokens: '/dashboard/analytics',
  notifications: '/dashboard/notifications',
  standup: '/dashboard/standup',
  'cost-tracker': '/dashboard/budgets',
  webhooks: '/dashboard/webhooks',
  security: '/dashboard/security',
} as const

export const DASHBOARD_SPA_PATHS = Object.values(DASHBOARD_PANEL_ROUTE_MAP)

export const ESSENTIAL_DASHBOARD_PANELS = [
  'overview',
  'agents',
  'tasks',
  'chat',
  'activity',
  'logs',
  'settings',
] as const

const PANEL_ALIASES: Record<string, string> = {
  analytics: 'tokens',
  autonomy: 'cron',
  control: 'settings',
  history: 'activity',
  orchestration: 'tasks',
  sessions: 'chat',
  budgets: 'cost-tracker',
}

const ROUTE_TO_PANEL_MAP = Object.entries(DASHBOARD_PANEL_ROUTE_MAP).reduce<Record<string, string>>(
  (accumulator, [panel, route]) => {
    accumulator[route] = panel
    return accumulator
  },
  {}
)

function normalizePathname(pathname: string | null | undefined) {
  if (!pathname || pathname === '/') {
    return '/dashboard'
  }

  return pathname !== '/dashboard' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export function normalizeDashboardPanel(panel: string | null | undefined) {
  const normalized = (panel || DEFAULT_DASHBOARD_PANEL).trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_DASHBOARD_PANEL
  }

  return PANEL_ALIASES[normalized] ?? normalized
}

export function dashboardPanelHref(panel: string) {
  const normalizedPanel = normalizeDashboardPanel(panel)

  return (
    DASHBOARD_PANEL_ROUTE_MAP[normalizedPanel as keyof typeof DASHBOARD_PANEL_ROUTE_MAP] ??
    `/dashboard/${normalizedPanel}`
  )
}

export function isSupportedDashboardPanel(panel: string | null | undefined) {
  if (!panel) {
    return false
  }

  const normalizedPanel = normalizeDashboardPanel(panel)
  return normalizedPanel in DASHBOARD_PANEL_ROUTE_MAP
}

export function getDashboardPanelForPath(pathname: string | null | undefined) {
  const normalizedPath = normalizePathname(pathname)
  return ROUTE_TO_PANEL_MAP[normalizedPath] ?? null
}

export function getDashboardPanelFromSegments(segments: string[] | undefined) {
  if (!segments || segments.length === 0) {
    return DEFAULT_DASHBOARD_PANEL
  }

  const panel = normalizeDashboardPanel(segments.join('/'))
  return isSupportedDashboardPanel(panel) ? panel : null
}

export function isEssentialDashboardPanel(panel: string) {
  return ESSENTIAL_DASHBOARD_PANELS.includes(
    normalizeDashboardPanel(panel) as (typeof ESSENTIAL_DASHBOARD_PANELS)[number]
  )
}

export function isTopLevelDashboardPath(pathname: string | null | undefined) {
  return Boolean(getDashboardPanelForPath(pathname))
}
