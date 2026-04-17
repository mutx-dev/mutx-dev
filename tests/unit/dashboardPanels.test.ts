import {
  getDashboardPanelForPath,
  getDashboardPanelFromSegments,
  isEssentialDashboardPanel,
  normalizeDashboardPanel,
} from '../../lib/dashboardPanels'
import { panelHref } from '../../lib/navigation'

describe('dashboard panel helpers', () => {
  it('normalizes mission-control aliases into MUTX panel ids', () => {
    expect(normalizeDashboardPanel(' Sessions ')).toBe('chat')
    expect(normalizeDashboardPanel('orchestration')).toBe('tasks')
    expect(normalizeDashboardPanel('analytics')).toBe('tokens')
  })

  it('maps top-level dashboard paths back to SPA panels', () => {
    expect(getDashboardPanelForPath('/dashboard')).toBe('overview')
    expect(getDashboardPanelForPath('/dashboard/history')).toBe('activity')
    expect(getDashboardPanelForPath('/dashboard/control')).toBe('settings')
    expect(getDashboardPanelForPath('/dashboard/autonomy')).toBe('cron')
    expect(getDashboardPanelForPath('/dashboard/deployments')).toBeNull()
    expect(getDashboardPanelForPath('/dashboard/agents/abc')).toBeNull()
  })

  it('recognizes catch-all panel segments only for supported panels', () => {
    expect(getDashboardPanelFromSegments(undefined)).toBe('overview')
    expect(getDashboardPanelFromSegments([])).toBe('overview')
    expect(getDashboardPanelFromSegments(['control'])).toBe('settings')
    expect(getDashboardPanelFromSegments(['sessions'])).toBe('chat')
    expect(getDashboardPanelFromSegments(['notifications'])).toBe('notifications')
    expect(getDashboardPanelFromSegments(['standup'])).toBe('standup')
    expect(getDashboardPanelFromSegments(['does-not-exist'])).toBeNull()
  })

  it('marks only the core shell panels as essential', () => {
    expect(isEssentialDashboardPanel('overview')).toBe(true)
    expect(isEssentialDashboardPanel('logs')).toBe(true)
    expect(isEssentialDashboardPanel('skills')).toBe(false)
    expect(isEssentialDashboardPanel('cost-tracker')).toBe(false)
  })

  it('routes notification-like panels through the catch-all shell paths', () => {
    expect(panelHref('notifications')).toBe('/dashboard/notifications')
    expect(panelHref('standup')).toBe('/dashboard/standup')
  })
})
