import { DASHBOARD_NAV_ITEMS, isDashboardNavItemActive } from '../../components/dashboard/dashboardNav'

describe('dashboardNav', () => {
  describe('DASHBOARD_NAV_ITEMS', () => {
    it('includes all required routes from the dashboard spec', () => {
      const hrefs = DASHBOARD_NAV_ITEMS.map((item) => item.href)

      expect(hrefs).toContain('/dashboard')
      expect(hrefs).toContain('/dashboard/agents')
      expect(hrefs).toContain('/dashboard/swarm')
      expect(hrefs).toContain('/dashboard/runs')
      expect(hrefs).toContain('/dashboard/traces')
      expect(hrefs).toContain('/dashboard/memory')
      expect(hrefs).toContain('/dashboard/budgets')
      expect(hrefs).toContain('/dashboard/spawn')
      expect(hrefs).toContain('/dashboard/webhooks')
      expect(hrefs).toContain('/dashboard/api-keys')
      expect(hrefs).toContain('/dashboard/monitoring')
    })

    it('has unique hrefs', () => {
      const hrefs = DASHBOARD_NAV_ITEMS.map((item) => item.href)
      const uniqueHrefs = new Set(hrefs)
      expect(uniqueHrefs.size).toBe(hrefs.length)
    })

    it('has title, description, href, and icon for every item', () => {
      for (const item of DASHBOARD_NAV_ITEMS) {
        expect(item.title).toBeTruthy()
        expect(item.description).toBeTruthy()
        expect(item.href).toMatch(/^\/dashboard/)
        expect(item.icon).toBeDefined()
      }
    })
  })

  describe('isDashboardNavItemActive', () => {
    it('matches the exact overview route', () => {
      expect(isDashboardNavItemActive('/dashboard', '/dashboard')).toBe(true)
    })

    it('does not match a sub-route for the overview', () => {
      expect(isDashboardNavItemActive('/dashboard/agents', '/dashboard')).toBe(false)
    })

    it('matches an exact sub-route', () => {
      expect(isDashboardNavItemActive('/dashboard/agents', '/dashboard/agents')).toBe(true)
    })

    it('matches a nested path under a sub-route', () => {
      expect(isDashboardNavItemActive('/dashboard/agents/agent-123', '/dashboard/agents')).toBe(true)
    })

    it('does not match an unrelated route', () => {
      expect(isDashboardNavItemActive('/dashboard/runs', '/dashboard/agents')).toBe(false)
    })
  })
})
