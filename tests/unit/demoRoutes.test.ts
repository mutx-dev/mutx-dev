import { getDemoSectionHref, isDemoSection } from '../../components/dashboard/demo/demoSections'
import { NAV_ITEMS } from '../../components/dashboard/demo/demoContent'

describe('demo control routes', () => {
  it('keeps every demo section under the /control namespace', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href)

    expect(hrefs).toEqual([
      '/control',
      '/control/agents',
      '/control/deployments',
      '/control/runs',
      '/control/environments',
      '/control/access',
      '/control/connectors',
      '/control/audit',
      '/control/usage',
      '/control/settings',
    ])
  })

  it('builds stable control hrefs for known demo sections', () => {
    expect(getDemoSectionHref('overview')).toBe('/control')
    expect(getDemoSectionHref('agents')).toBe('/control/agents')
    expect(getDemoSectionHref('settings')).toBe('/control/settings')
  })

  it('recognizes the sections used by the demo app route handler', () => {
    expect(isDemoSection('agents')).toBe(true)
    expect(isDemoSection('settings')).toBe(true)
    expect(isDemoSection('dashboard')).toBe(false)
  })
})
