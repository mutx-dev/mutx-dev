import { getDemoSectionHref, isDemoSection } from '../../components/dashboard/demo/demoSections'
import { NAV_ITEMS } from '../../components/dashboard/demo/demoContent'

describe('demo dashboard routes', () => {
  it('keeps every demo section under the /dashboard namespace', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href)

    expect(hrefs).toEqual([
      '/dashboard',
      '/dashboard/agents',
      '/dashboard/deployments',
      '/dashboard/runs',
      '/dashboard/monitoring',
      '/dashboard/security',
      '/dashboard/webhooks',
      '/dashboard/history',
      '/dashboard/budgets',
      '/dashboard/control',
    ])
  })

  it('builds stable dashboard hrefs for known demo sections', () => {
    expect(getDemoSectionHref('overview')).toBe('/dashboard')
    expect(getDemoSectionHref('agents')).toBe('/dashboard/agents')
    expect(getDemoSectionHref('settings')).toBe('/dashboard/control')
  })

  it('recognizes the sections used by the demo app route handler', () => {
    expect(isDemoSection('agents')).toBe(true)
    expect(isDemoSection('settings')).toBe(true)
    expect(isDemoSection('dashboard')).toBe(false)
  })
})
