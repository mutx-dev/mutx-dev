'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function picoHref(pathname: string, target: string) {
  const normalizedTarget = target === '/' ? '' : target
  return pathname.startsWith('/pico') ? `/pico${normalizedTarget}` || '/pico' : target
}

export function usePicoHref() {
  const pathname = usePathname()

  return useCallback(
    (target: string) => picoHref(pathname, target),
    [pathname],
  )
}
