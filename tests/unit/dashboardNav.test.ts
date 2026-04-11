import {
  ALL_DASHBOARD_NAV_ITEMS,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_ITEMS,
  getDashboardNavHref,
  isDashboardNavItemActive,
} from '../../components/dashboard/dashboardNav'
import { PRIMARY_DESKTOP_ROUTE_ORDER } from '../../components/desktop/desktopRouteConfig'

describe('dashboard navigation helpers', () => {
  const homeItem = DASHBOARD_NAV_ITEMS.find((item) => item.key === 'home')!
  const agentsItem = DASHBOARD_NAV_ITEMS.find((item) => item.key === 'agents')!
  const sessionsItem = DASHBOARD_NAV_ITEMS.find((item) => item.key === 'sessions')!

  it('keeps primary dashboard nav items in desktop route order', () => {
    expect(DASHBOARD_NAV_ITEMS.map((item) => item.key)).toEqual(PRIMARY_DESKTOP_ROUTE_ORDER)
    expect(ALL_DASHBOARD_NAV_ITEMS).toEqual(
      expect.arrayContaining(DASHBOARD_NAV_ITEMS),
    )
  })

  it('uses internal hrefs for dashboard and app shells', () => {
    expect(getDashboardNavHref('/dashboard', sessionsItem)).toBe('/dashboard/sessions')
    expect(getDashboardNavHref('/app/runtime', sessionsItem)).toBe('/dashboard/sessions')
  })

  it('uses public hrefs outside the dashboard shells', () => {
    expect(getDashboardNavHref('/pricing', agentsItem)).toBe('/agents')
  })

  it('treats overview aliases as active for the home nav item', () => {
    expect(isDashboardNavItemActive('/', homeItem)).toBe(true)
    expect(isDashboardNavItemActive('/dashboard', homeItem)).toBe(true)
    expect(isDashboardNavItemActive('/overview', homeItem)).toBe(true)
    expect(isDashboardNavItemActive('/dashboard/agents', homeItem)).toBe(false)
  })

  it('treats nested route paths as active and ignores trailing slashes', () => {
    expect(isDashboardNavItemActive('/dashboard/agents/', agentsItem)).toBe(true)
    expect(isDashboardNavItemActive('/agents/launch', agentsItem)).toBe(true)
    expect(isDashboardNavItemActive('/dashboard/api-keys', agentsItem)).toBe(false)
  })

  it('groups every primary nav item exactly once', () => {
    const groupedKeys = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.key))

    expect(groupedKeys).toEqual(DASHBOARD_NAV_ITEMS.map((item) => item.key))
  })
})
