'use client'

import { useEffect } from 'react'

type PicoWipReturnProps = {
  href?: string
  delayMs?: number
}

export function PicoWipReturn({ href = '/', delayMs = 2500 }: PicoWipReturnProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(href)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [delayMs, href])

  return null
}
