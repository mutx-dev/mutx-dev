'use client'

import { useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'

export function picoHref(pathname: string, target: string) {
  const normalizedTarget = target === '/' ? '' : target
  if (!pathname.startsWith('/pico')) {
    return target
  }

  return normalizedTarget ? `/pico${normalizedTarget}` : '/pico'
}

export function picoEntryHref(pathname: string) {
  return pathname.startsWith('/pico') ? '/pico/onboarding' : '/start'
}

export function usePicoHref() {
  const pathname = usePathname()

  return useCallback(
    (target: string) => picoHref(pathname, target),
    [pathname],
  )
}

export function usePicoEntryHref() {
  const pathname = usePathname()

  return useMemo(() => picoEntryHref(pathname), [pathname])
}
