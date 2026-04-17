'use client'

import { startTransition, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import {
  DASHBOARD_SPA_EVENT,
  normalizeDashboardPanel,
  panelHref as buildPanelHref,
} from '@/lib/dashboardPanels'
import { useMissionControl } from '@/lib/store'

const PREFETCHED_ROUTES = new Set<string>()
let lastDefaultPrefetchPath = ''

const DEFAULT_PREFETCH_PANELS = [
  'overview',
  'chat',
  'tasks',
  'agents',
  'activity',
  'notifications',
  'tokens',
]

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
  return buildPanelHref(panel)
}
export function useDashboardPathname(spaShellEnabled = false): string {
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const [spaPathname, setSpaPathname] = useState(normalizedPathname)

  useEffect(() => {
    setSpaPathname(normalizedPathname)
  }, [normalizedPathname])

  useEffect(() => {
    if (!spaShellEnabled || typeof window === 'undefined') {
      return
    }

    const syncPathname = () => {
      setSpaPathname(normalizePathname(window.location.pathname))
    }

    syncPathname()
    window.addEventListener('popstate', syncPathname)
    window.addEventListener(DASHBOARD_SPA_EVENT, syncPathname)

    return () => {
      window.removeEventListener('popstate', syncPathname)
      window.removeEventListener(DASHBOARD_SPA_EVENT, syncPathname)
    }
  }, [spaShellEnabled])

  return spaShellEnabled ? spaPathname : normalizedPathname
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
  const router = useRouter()
  const setActiveTab = useMissionControl((state) => state.setActiveTab)
  const setChatPanelOpen = useMissionControl((state) => state.setChatPanelOpen)
  const prefetchPanel = usePrefetchPanel()
  const spaShellEnabled = process.env.NEXT_PUBLIC_SPA_SHELL === 'true'
  const pathname = useDashboardPathname(spaShellEnabled)

  return (panel: string) => {
    const normalizedPanel = normalizeDashboardPanel(panel) || 'overview'
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

    if (spaShellEnabled && typeof window !== 'undefined' && href.startsWith('/dashboard')) {
      window.history.pushState({ panel: normalizedPanel }, '', href)
      window.dispatchEvent(new Event(DASHBOARD_SPA_EVENT))
      return
    }

    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }
}
