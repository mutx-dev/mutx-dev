'use client'

import { useEffect, useState } from 'react'

type PicoSessionUser = {
  email?: string | null
  name?: string | null
  role?: string | null
  plan?: string | null
  isEmailVerified?: boolean | null
  preferredLocale?: string | null
}

export type PicoSessionState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: PicoSessionUser; error: null }
  | { status: 'unauthenticated'; user: null; error: null }
  | { status: 'error'; user: null; error: string }

export function usePicoSession() {
  const [session, setSession] = useState<PicoSessionState>({
    status: 'loading',
    user: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (cancelled) {
          return
        }

        if (response.status === 401) {
          setSession({ status: 'unauthenticated', user: null, error: null })
          return
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          setSession({
            status: 'error',
            user: null,
            error:
              typeof payload?.detail === 'string' && payload.detail
                ? payload.detail
                : 'Failed to load Pico session',
          })
          return
        }

        const payload = (await response.json()) as {
          email?: string | null
          name?: string | null
          role?: string | null
          plan?: string | null
          is_email_verified?: boolean | null
          preferred_locale?: string | null
        }
        setSession({
          status: 'authenticated',
          user: {
            email: payload.email ?? null,
            name: payload.name ?? null,
            role: payload.role ?? null,
            plan: payload.plan ?? null,
            isEmailVerified:
              typeof payload.is_email_verified === 'boolean'
                ? payload.is_email_verified
                : null,
            preferredLocale:
              typeof payload.preferred_locale === 'string' ? payload.preferred_locale : null,
          },
          error: null,
        })
      } catch {
        if (!cancelled) {
          setSession({
            status: 'error',
            user: null,
            error: 'Failed to connect to the hosted auth session',
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return session
}
