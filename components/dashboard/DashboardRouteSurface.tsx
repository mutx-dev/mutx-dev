'use client'

import type { ReactNode } from 'react'

import { DashboardSpaPanelHost } from '@/components/dashboard/DashboardSpaPanelHost'
import { useDesktopStatus } from '@/components/desktop/useDesktopStatus'

export function DashboardRouteSurface({
  children,
  spaShellEnabled,
}: {
  children: ReactNode
  spaShellEnabled: boolean
}) {
  const { isDesktop } = useDesktopStatus()

  if (!spaShellEnabled || isDesktop) {
    return <>{children}</>
  }

  return <DashboardSpaPanelHost />
}
