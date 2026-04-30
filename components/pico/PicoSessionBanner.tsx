'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { buildOAuthStartHref, oauthProviders } from '@/lib/auth/oauth'
import { picoClasses, picoEmber, picoPanel, picoSoft } from '@/components/pico/picoTheme'
import { type PicoSessionState } from '@/components/pico/usePicoSession'
import { mergeRedirectPathWithSearch, resolveRedirectPath } from '@/lib/auth/redirects'

type PicoSessionBannerProps = {
  session: PicoSessionState
  nextPath: string
}

type HostedReadinessState = {
  webhookCount: number | null
  loading: boolean
  error: string | null
}

export function PicoSessionBanner({ session, nextPath }: PicoSessionBannerProps) {
  const searchParams = useSearchParams()
  const redirectPath = resolveRedirectPath(
    mergeRedirectPathWithSearch(nextPath, searchParams.toString()),
    '/pico/onboarding',
  )
  const [readiness, setReadiness] = useState<HostedReadinessState>({
    webhookCount: null,
    loading: false,
    error: null,
  })
  useEffect(() => {
    if (session.status !== 'authenticated') {
      setReadiness({
        webhookCount: null,
        loading: false,
        error: null,
      })
      return
    }

    let cancelled = false

    async function loadReadiness() {
      setReadiness((previous) => ({
        webhookCount: previous.webhookCount,
        loading: true,
        error: null,
      }))

      try {
        const response = await fetch('/api/webhooks', {
          credentials: 'include',
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => null)

        if (cancelled) {
          return
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === 'string' && payload.error
              ? payload.error
              : typeof payload?.detail === 'string' && payload.detail
                ? payload.detail
                : 'Failed to load webhook routes',
          )
        }

        const rawWebhooks = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.webhooks)
            ? payload.webhooks
            : []

        setReadiness({
          webhookCount: rawWebhooks.length,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (!cancelled) {
          setReadiness({
            webhookCount: null,
            loading: false,
            error:
              error instanceof Error ? error.message : 'Failed to load webhook routes',
          })
        }
      }
    }

    void loadReadiness()

    return () => {
      cancelled = true
    }
  }, [session.status])

  if (session.status === 'authenticated') {
    return (
      <div className={picoPanel('p-3 sm:p-4')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoClasses.chip}>hosted session live</span>
              <span className={picoClasses.chip}>
                {session.user.plan ? `${session.user.plan.toLowerCase()} plan` : 'plan unknown'}
              </span>
              <span className={picoClasses.chip}>
                {session.user.isEmailVerified === false
                  ? 'verification pending'
                  : session.user.isEmailVerified === true
                    ? 'email verified'
                    : 'email status unknown'}
              </span>
              <span className={picoClasses.chip}>
                {readiness.loading
                  ? 'checking webhooks'
                  : readiness.webhookCount != null
                    ? `${readiness.webhookCount} webhook${readiness.webhookCount === 1 ? '' : 's'}`
                    : 'webhooks partial'}
              </span>
            </div>
            <p className="mt-2 truncate text-sm text-[color:var(--pico-text-secondary)]">
              Signed in as {session.user.email ?? session.user.name ?? 'user'} - progress sync and runtime reads are attached.
            </p>
            {readiness.error ? (
              <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{readiness.error}</p>
            ) : null}
          </div>

          <div className={picoSoft('grid gap-2 p-3 sm:min-w-[22rem]')}>
            <div className="grid grid-cols-3 gap-2 text-xs text-[color:var(--pico-text-secondary)]">
              <div>
                <p className="text-[color:var(--pico-text-muted)]">Sync</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">live</p>
              </div>
              <div>
                <p className="text-[color:var(--pico-text-muted)]">Email</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">
                  {session.user.isEmailVerified === false ? 'pending' : 'verified'}
                </p>
              </div>
              <div>
                <p className="text-[color:var(--pico-text-muted)]">Runtime</p>
                <p className="mt-1 font-medium text-[color:var(--pico-text)]">
                  {readiness.loading
                    ? 'checking'
                    : readiness.webhookCount != null && readiness.webhookCount > 0
                      ? 'available'
                      : 'partial'}
                </p>
              </div>
            </div>
            {session.user.isEmailVerified === false && session.user.email ? (
              <Link
                href={`/verify-email?email=${encodeURIComponent(session.user.email)}&next=${encodeURIComponent(redirectPath)}`}
                className={picoClasses.secondaryButton}
              >
                Finish verification
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (session.status === 'loading') {
    return (
      <div className={picoPanel('p-4 sm:p-5')}>
        <p className={picoClasses.label}>Hosted session</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
          Checking whether this Pico host has a session attached.
        </p>
      </div>
    )
  }

  if (session.status === 'error') {
    return (
      <div className={picoEmber('p-4 sm:p-5')}>
        <p className={picoClasses.label}>Hosted session</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{session.error}</p>
      </div>
    )
  }

  return (
    <div className={picoEmber('p-3 sm:p-4')}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={picoClasses.chip}>hosted session required</span>
            <span className={picoClasses.chip}>local preview</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            Sign in to persist progress, read live runtime state, and use hosted approvals on this Pico domain.
          </p>
        </div>

        <div className={picoSoft('grid gap-3 p-3 sm:min-w-[24rem]')}>
          <div className="grid grid-cols-3 gap-2 text-xs text-[color:var(--pico-text-secondary)]">
            <div>
              <p className="text-[color:var(--pico-text-muted)]">Progress</p>
              <p className="mt-1 font-medium text-[color:var(--pico-text)]">local</p>
            </div>
            <div>
              <p className="text-[color:var(--pico-text-muted)]">Runtime</p>
              <p className="mt-1 font-medium text-[color:var(--pico-text)]">limited</p>
            </div>
            <div>
              <p className="text-[color:var(--pico-text-muted)]">Approvals</p>
              <p className="mt-1 font-medium text-[color:var(--pico-text)]">blocked</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/login?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.primaryButton}>
              Sign in
            </Link>
            <Link href={`/register?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.secondaryButton}>
              Create account
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {oauthProviders.slice(0, 4).map((provider) => (
              <Link
                key={provider.id}
                href={buildOAuthStartHref(provider.id, 'login', redirectPath)}
                prefetch={false}
                className={picoClasses.tertiaryButton}
              >
                {provider.buttonLabel}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
