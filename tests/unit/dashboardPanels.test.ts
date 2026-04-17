import {
  ESSENTIAL_PANELS,
  isPanelAccessibleInMode,
  panelHref,
  resolveDashboardPanel,
} from '../../lib/dashboardPanels'

describe('dashboard panel routing helpers', () => {
  it('resolves mission control panel ids from dashboard paths and aliases', () => {
    expect(resolveDashboardPanel('/dashboard')).toBe('overview')
    expect(resolveDashboardPanel('/dashboard/sessions')).toBe('chat')
    expect(resolveDashboardPanel('/dashboard/chat')).toBe('chat')
    expect(resolveDashboardPanel('/dashboard/orchestration')).toBe('tasks')
    expect(resolveDashboardPanel('/dashboard/tasks')).toBe('tasks')
    expect(resolveDashboardPanel('/dashboard/analytics')).toBe('tokens')
    expect(resolveDashboardPanel('/dashboard/control')).toBe('settings')
    expect(resolveDashboardPanel('/dashboard/history')).toBe('activity')
    expect(resolveDashboardPanel('/dashboard/autonomy')).toBe('cron')
    expect(resolveDashboardPanel('/dashboard/notifications')).toBe('notifications')
    expect(resolveDashboardPanel('/dashboard/standup')).toBe('standup')
  })

  it('maps panel ids to the existing MUTX routes instead of inventing new namespaces', () => {
    expect(panelHref('chat')).toBe('/dashboard/sessions')
    expect(panelHref('tasks')).toBe('/dashboard/orchestration')
    expect(panelHref('tokens')).toBe('/dashboard/analytics')
    expect(panelHref('settings')).toBe('/dashboard/control')
    expect(panelHref('cron')).toBe('/dashboard/autonomy')
    expect(panelHref('notifications')).toBe('/dashboard/notifications')
  })

  it('gates non-essential panels when the shell is reduced to essential mode', () => {
    expect(ESSENTIAL_PANELS.has('overview')).toBe(true)
    expect(ESSENTIAL_PANELS.has('chat')).toBe(true)
    expect(ESSENTIAL_PANELS.has('security')).toBe(false)
    expect(isPanelAccessibleInMode('chat', 'essential')).toBe(true)
    expect(isPanelAccessibleInMode('security', 'essential')).toBe(false)
    expect(isPanelAccessibleInMode('security', 'full')).toBe(true)
  })
})
