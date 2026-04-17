export type DashboardPanelId =
  | 'overview'
  | 'agents'
  | 'deployments'
  | 'documents'
  | 'reasoning'
  | 'runs'
  | 'monitoring'
  | 'traces'
  | 'observability'
  | 'chat'
  | 'api-keys'
  | 'cost-tracker'
  | 'webhooks'
  | 'security'
  | 'tasks'
  | 'memory'
  | 'tokens'
  | 'channels'
  | 'activity'
  | 'skills'
  | 'logs'
  | 'settings'
  | 'cron'
  | 'swarm'
  | 'templates'
  | 'notifications'
  | 'standup'

export const DASHBOARD_SPA_EVENT = 'mutx:dashboard:navigate'

export const ESSENTIAL_PANELS = new Set<DashboardPanelId>([
  'overview',
  'agents',
  'tasks',
  'chat',
  'activity',
  'logs',
  'settings',
])

export const DASHBOARD_PANEL_ROUTE_MAP: Record<DashboardPanelId, string> = {
  overview: '/dashboard',
  agents: '/dashboard/agents',
  deployments: '/dashboard/deployments',
  documents: '/dashboard/documents',
  reasoning: '/dashboard/reasoning',
  runs: '/dashboard/runs',
  monitoring: '/dashboard/monitoring',
  traces: '/dashboard/traces',
  observability: '/dashboard/observability',
  chat: '/dashboard/sessions',
  'api-keys': '/dashboard/api-keys',
  'cost-tracker': '/dashboard/budgets',
  webhooks: '/dashboard/webhooks',
  security: '/dashboard/security',
  tasks: '/dashboard/orchestration',
  memory: '/dashboard/memory',
  tokens: '/dashboard/analytics',
  channels: '/dashboard/channels',
  activity: '/dashboard/history',
  skills: '/dashboard/skills',
  logs: '/dashboard/logs',
  settings: '/dashboard/control',
  cron: '/dashboard/autonomy',
  swarm: '/dashboard/swarm',
  templates: '/dashboard/templates',
  notifications: '/dashboard/notifications',
  standup: '/dashboard/standup',
}

const DASHBOARD_PATH_TO_PANEL: Record<string, DashboardPanelId> = {
  dashboard: 'overview',
  agents: 'agents',
  deployments: 'deployments',
  documents: 'documents',
  reasoning: 'reasoning',
  runs: 'runs',
  monitoring: 'monitoring',
  traces: 'traces',
  observability: 'observability',
  sessions: 'chat',
  chat: 'chat',
  'api-keys': 'api-keys',
  budgets: 'cost-tracker',
  'cost-tracker': 'cost-tracker',
  webhooks: 'webhooks',
  security: 'security',
  orchestration: 'tasks',
  tasks: 'tasks',
  memory: 'memory',
  analytics: 'tokens',
  tokens: 'tokens',
  channels: 'channels',
  history: 'activity',
  activity: 'activity',
  skills: 'skills',
  logs: 'logs',
  control: 'settings',
  settings: 'settings',
  autonomy: 'cron',
  cron: 'cron',
  swarm: 'swarm',
  templates: 'templates',
  notifications: 'notifications',
  standup: 'standup',
}

export function normalizeDashboardPanel(panel: string): string {
  return panel.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

export function resolveDashboardPanel(pathname: string | null | undefined): DashboardPanelId {
  if (!pathname || pathname === '/' || pathname === '/dashboard') {
    return 'overview'
  }

  const normalizedPath =
    pathname !== '/dashboard' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const segments = normalizedPath.split('/').filter(Boolean)

  if (segments.length === 0 || segments[0] !== 'dashboard') {
    return 'overview'
  }

  if (segments.length === 1) {
    return 'overview'
  }

  return DASHBOARD_PATH_TO_PANEL[segments[1]] ?? 'overview'
}

export function panelHref(panel: string): string {
  const normalizedPanel = normalizeDashboardPanel(panel) as DashboardPanelId

  if (!normalizedPanel || normalizedPanel === 'overview') {
    return '/dashboard'
  }

  return DASHBOARD_PANEL_ROUTE_MAP[normalizedPanel] ?? `/dashboard/${normalizedPanel}`
}

export function isEssentialPanel(panel: DashboardPanelId): boolean {
  return ESSENTIAL_PANELS.has(panel)
}

export function isPanelAccessibleInMode(
  panel: DashboardPanelId,
  mode: 'essential' | 'full',
): boolean {
  return mode === 'full' || ESSENTIAL_PANELS.has(panel)
}
