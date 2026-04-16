import { panelHref } from '../../lib/navigation'

describe('panelHref', () => {
  it('maps mission-control panel ids to dashboard routes', () => {
    expect(panelHref('overview')).toBe('/dashboard')
    expect(panelHref('agents')).toBe('/dashboard/agents')
    expect(panelHref('chat')).toBe('/dashboard/sessions')
    expect(panelHref('tasks')).toBe('/dashboard/orchestration')
    expect(panelHref('activity')).toBe('/dashboard/history')
    expect(panelHref('tokens')).toBe('/dashboard/analytics')
  })

  it('normalizes casing and whitespace before building routes', () => {
    expect(panelHref(' Overview ')).toBe('/dashboard')
    expect(panelHref('  SKILLS  ')).toBe('/dashboard/skills')
  })

  it('falls back to dashboard-prefixed routes for unknown panels', () => {
    expect(panelHref('deployments')).toBe('/dashboard/deployments')
  })
})
