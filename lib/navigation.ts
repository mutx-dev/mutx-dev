'use client'

import { startTransition, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useMissionControl } from '@/lib/store'

const PREFETCHED_ROUTES = new Set<string>()
let lastDefaultPrefetchPath = ''

const PANEL_ROUTE_MAP: Record<string, string> = {
  overview: '/dashboard',
  agents: '/dashboard/agents',
  tasks: '/dashboard/orchestration',
  chat: '/dashboard/sessions',
  activity: '/dashboard/history',
  notifications: '/dashboard/monitoring',
  tokens: '/dashboard/analytics',
  logs: '/dashboard/logs',
  cron: '/dashboard/autonomy',
  memory: '/dashboard/memory',
  skills: '/dashboard/skills',
  settings: '/dashboard/control',
  'cost-tracker': '/dashboard/budgets',
  webhooks: '/dashboard/webhooks',
  security: '/dashboard/security',
}

const DEFAULT_PREFETCH_PANELS = [
  'overview',
  'chat',
  'tasks',
  'agents',
  'activity',
  'notifications',
  'tokens',
]

function normalizePanel(panel: string): string {
  return panel.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/') {
    return '/dashboard'
  }

  if (pathname !== '/dashboard' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function prefetchHref(router: ReturnType<typeof useRouter>, href: string) {
  if (PREFETCHED_ROUTES.has(href)) {
    return
  }

  PREFETCHED_ROUTES.add(href)

  try {
    router.prefetch(href)
  } catch {
    PREFETCHED_ROUTES.delete(href)
  }
}

export function panelHref(panel: string): string {
  const normalizedPanel = normalizePanel(panel)

  if (!normalizedPanel || normalizedPanel === 'overview') {
    return '/dashboard'
  }

  return PANEL_ROUTE_MAP[normalizedPanel] ?? `/dashboard/${normalizedPanel}`
}

export function usePrefetchPanel(): (panel: string) => void {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const currentPath = normalizePathname(pathname)
    if (lastDefaultPrefetchPath === currentPath) {
      return
    }

    lastDefaultPrefetchPath = currentPath

    for (const panel of DEFAULT_PREFETCH_PANELS) {
      const href = panelHref(panel)
      if (href !== currentPath) {
        prefetchHref(router, href)
      }
    }
  }, [pathname, router])

  return (panel: string) => {
    prefetchHref(router, panelHref(panel))
  }
}

export function useNavigateToPanel(): (panel: string) => void {
  const pathname = usePathname()
  const router = useRouter()
  const setActiveTab = useMissionControl((state) => state.setActiveTab)
  const setChatPanelOpen = useMissionControl((state) => state.setChatPanelOpen)
  const prefetchPanel = usePrefetchPanel()

  return (panel: string) => {
    const normalizedPanel = normalizePanel(panel) || 'overview'
    const href = panelHref(normalizedPanel)

    if (normalizePathname(pathname) === href) {
      setActiveTab(normalizedPanel)
      return
    }

    prefetchPanel(normalizedPanel)
    setActiveTab(normalizedPanel)

    if (normalizedPanel === 'chat') {
      setChatPanelOpen(false)
    }

    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }
}
