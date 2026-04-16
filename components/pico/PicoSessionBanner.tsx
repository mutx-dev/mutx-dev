'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { buildOAuthStartHref, oauthProviders } from '@/lib/auth/oauth'
import { picoClasses, picoEmber, picoInset, picoPanel, picoSoft } from '@/components/pico/picoTheme'
import { type PicoSessionState } from '@/components/pico/usePicoSession'
import { resolveRedirectPath } from '@/lib/auth/redirects'

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
  const redirectPath = resolveRedirectPath(nextPath, '/pico/onboarding')
  const [readiness, setReadiness] = useState<HostedReadinessState>({
    webhookCount: null,
    loading: false,
    error: null,
  })
  const authenticatedRailClass =
    'mt-4 grid grid-flow-col auto-cols-[minmax(12rem,72vw)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:grid-cols-2 xl:grid-cols-4'
  const anonymousRailClass =
    'mt-4 grid grid-flow-col auto-cols-[minmax(12rem,72vw)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:grid-cols-3'

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
      <div className={picoPanel('p-4 sm:p-5')}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoClasses.chip}>hosted session attached</span>
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
                  ? 'loading webhooks'
                  : readiness.webhookCount != null
                    ? `${readiness.webhookCount} webhook${readiness.webhookCount === 1 ? '' : 's'}`
                    : 'webhooks unavailable'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              Signed in as <span className="text-[color:var(--pico-text)]">{session.user.email ?? session.user.name ?? 'operator'}</span>. Progress sync, onboarding state, approvals, and live runtime data can now use the hosted MUTX account on this host.
            </p>

            <div className={authenticatedRailClass}>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Identity</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {session.user.name ?? 'operator'}
                </p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Plan</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {session.user.plan ? session.user.plan.toLowerCase() : 'unknown'}
                </p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Email state</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {session.user.isEmailVerified === false
                    ? 'pending'
                    : session.user.isEmailVerified === true
                      ? 'verified'
                      : 'unknown'}
                </p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Webhook routes</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {readiness.loading
                    ? 'loading'
                    : readiness.webhookCount != null
                      ? String(readiness.webhookCount)
                      : 'n/a'}
                </p>
              </div>
            </div>

            {session.user.isEmailVerified === false && session.user.email ? (
              <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                Password accounts stay limited until the inbox link is confirmed. Finish that before treating the hosted session as production-ready.
              </p>
            ) : null}
            {readiness.error ? (
              <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{readiness.error}</p>
            ) : null}
          </div>

          <div className={picoSoft('grid gap-3 p-4')}>
            <p className={picoClasses.label}>Product truth</p>
            <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              The product can now tell the truth about progress, runtime state, approvals, and hosted setup. If this account is not production-ready yet, fix that here before trusting the rest of the surface.
            </p>
            <div className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                <span>Progress sync</span>
                <span className="text-[color:var(--pico-text)]">live</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                <span>Runtime truth</span>
                <span className="text-right text-[color:var(--pico-text)]">
                  {readiness.loading
                    ? 'checking'
                    : readiness.webhookCount != null && readiness.webhookCount > 0
                      ? 'grounded'
                      : 'partial'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Approval confidence</span>
                <span className="text-right text-[color:var(--pico-text)]">
                  {session.user.isEmailVerified === false ? 'limited' : 'usable'}
                </span>
              </div>
            </div>
            {session.user.isEmailVerified === false && session.user.email ? (
              <Link
                href={`/verify-email?email=${encodeURIComponent(session.user.email)}&next=${encodeURIComponent(redirectPath)}`}
                className={picoClasses.secondaryButton}
              >
                Finish email verification
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
          Checking whether this Pico host has an operator session attached.
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
    <div className={picoEmber('p-4 sm:p-5')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),24rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={picoClasses.chip}>hosted session required</span>
            <span className={picoClasses.chip}>pico host auth</span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            The Pico platform routes are live here, but the hosted session is not attached yet on this domain. Sign in on Pico to persist progress, read live runs, and use the backend onboarding/runtime state. Google, GitHub, Discord, Apple, password signup, and email confirmation all terminate on this host now.
          </p>
          <div className={anonymousRailClass}>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">Progress</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">won’t persist</p>
            </div>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">Runtime truth</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">limited</p>
            </div>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">Approvals</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">read-only feeling</p>
            </div>
          </div>
        </div>

        <div className={picoSoft('grid gap-3 p-4')}>
          <p className={picoClasses.label}>Without session</p>
          <div className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
              <span>Progress sync</span>
              <span className="text-[color:var(--pico-text)]">local only</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
              <span>Runtime truth</span>
              <span className="text-right text-[color:var(--pico-text)]">not trustworthy yet</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Approvals + webhooks</span>
              <span className="text-right text-[color:var(--pico-text)]">blocked</span>
            </div>
          </div>
          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            Attach the Pico account on this host before you trust progress, live runtime state, or approval behavior.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/login?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.primaryButton}>
              Sign in
            </Link>
            <Link href={`/register?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.secondaryButton}>
              Create account
            </Link>
          </div>
          <div className="grid gap-2">
            {oauthProviders.map((provider) => (
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
