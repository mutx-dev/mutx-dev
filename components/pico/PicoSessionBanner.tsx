'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { buildOAuthStartHref, oauthProviders } from '@/lib/auth/oauth'
import { picoClasses, picoEmber, picoInset, picoPanel, picoSoft } from '@/components/pico/picoTheme'
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
  const t = useTranslations('pico.sessionBanner')
  const redirectPath = resolveRedirectPath(
    mergeRedirectPathWithSearch(nextPath, searchParams.toString()),
    '/pico/onboarding',
  )
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
                : t('errors.loadWebhookRoutes'),
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
              error instanceof Error ? error.message : t('errors.loadWebhookRoutes'),
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
    const identity = session.user.email ?? session.user.name ?? t('authenticated.rails.operator')
    const planChip = session.user.plan
      ? t('authenticated.chips.plan', { plan: session.user.plan.toLowerCase() })
      : t('authenticated.chips.planUnknown')
    const emailChip =
      session.user.isEmailVerified === false
        ? t('authenticated.chips.verificationPending')
        : session.user.isEmailVerified === true
          ? t('authenticated.chips.emailVerified')
          : t('authenticated.chips.emailStatusUnknown')
    const webhookChip = readiness.loading
      ? t('authenticated.chips.loadingWebhooks')
      : readiness.webhookCount != null
        ? t('authenticated.chips.webhookCount', {
            count: readiness.webhookCount,
            pluralSuffix: readiness.webhookCount === 1 ? '' : 's',
          })
        : t('authenticated.chips.webhooksUnavailable')
    const emailState =
      session.user.isEmailVerified === false
        ? t('authenticated.rails.pending')
        : session.user.isEmailVerified === true
          ? t('authenticated.rails.verified')
          : t('authenticated.rails.unknown')

    return (
      <div className={picoPanel('p-4 sm:p-5')}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={picoClasses.chip}>{t('authenticated.chips.sessionAttached')}</span>
              <span className={picoClasses.chip}>{planChip}</span>
              <span className={picoClasses.chip}>{emailChip}</span>
              <span className={picoClasses.chip}>{webhookChip}</span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {t('authenticated.body', { identity })}
            </p>

            <div className={authenticatedRailClass}>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{t('authenticated.rails.identity')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {session.user.name ?? t('authenticated.rails.operator')}
                </p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{t('authenticated.rails.plan')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {session.user.plan ? session.user.plan.toLowerCase() : t('authenticated.rails.unknown')}
                </p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{t('authenticated.rails.emailState')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{emailState}</p>
              </div>
              <div className={picoInset('snap-start p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">{t('authenticated.rails.webhookRoutes')}</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {readiness.loading
                    ? t('authenticated.rails.loading')
                    : readiness.webhookCount != null
                      ? String(readiness.webhookCount)
                      : t('authenticated.rails.na')}
                </p>
              </div>
            </div>

            {session.user.isEmailVerified === false && session.user.email ? (
              <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {t('authenticated.verificationNote')}
              </p>
            ) : null}
            {readiness.error ? (
              <p className="mt-4 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{readiness.error}</p>
            ) : null}
          </div>

          <div className={picoSoft('grid gap-3 p-4')}>
            <p className={picoClasses.label}>{t('authenticated.productTruth.label')}</p>
            <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {t('authenticated.productTruth.body')}
            </p>
            <div className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                <span>{t('authenticated.productTruth.progressSync')}</span>
                <span className="text-[color:var(--pico-text)]">{t('authenticated.productTruth.live')}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
                <span>{t('authenticated.productTruth.runtimeTruth')}</span>
                <span className="text-right text-[color:var(--pico-text)]">
                  {readiness.loading
                    ? t('authenticated.productTruth.checking')
                    : readiness.webhookCount != null && readiness.webhookCount > 0
                      ? t('authenticated.productTruth.grounded')
                      : t('authenticated.productTruth.partial')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t('authenticated.productTruth.approvalConfidence')}</span>
                <span className="text-right text-[color:var(--pico-text)]">
                  {session.user.isEmailVerified === false
                    ? t('authenticated.productTruth.limited')
                    : t('authenticated.productTruth.usable')}
                </span>
              </div>
            </div>
            {session.user.isEmailVerified === false && session.user.email ? (
              <Link
                href={`/verify-email?email=${encodeURIComponent(session.user.email)}&next=${encodeURIComponent(redirectPath)}`}
                className={picoClasses.secondaryButton}
              >
                {t('authenticated.finishEmailVerification')}
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
        <p className={picoClasses.label}>{t('loading.label')}</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
          {t('loading.body')}
        </p>
      </div>
    )
  }

  if (session.status === 'error') {
    return (
      <div className={picoEmber('p-4 sm:p-5')}>
        <p className={picoClasses.label}>{t('loading.label')}</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{session.error}</p>
      </div>
    )
  }

  return (
    <div className={picoEmber('p-4 sm:p-5')}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),24rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={picoClasses.chip}>{t('anonymous.chips.sessionRequired')}</span>
            <span className={picoClasses.chip}>{t('anonymous.chips.picoHostAuth')}</span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            {t('anonymous.body')}
          </p>
          <div className={anonymousRailClass}>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">{t('anonymous.rails.progress')}</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{t('anonymous.rails.wontPersist')}</p>
            </div>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">{t('anonymous.rails.runtimeTruth')}</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{t('anonymous.rails.limited')}</p>
            </div>
            <div className={picoInset('snap-start p-4')}>
              <p className="text-sm text-[color:var(--pico-text-muted)]">{t('anonymous.rails.approvals')}</p>
              <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{t('anonymous.rails.readOnlyFeeling')}</p>
            </div>
          </div>
        </div>

        <div className={picoSoft('grid gap-3 p-4')}>
          <p className={picoClasses.label}>{t('anonymous.withoutSession.label')}</p>
          <div className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
              <span>{t('anonymous.withoutSession.progressSync')}</span>
              <span className="text-[color:var(--pico-text)]">{t('anonymous.withoutSession.localOnly')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--pico-border)] pb-2">
              <span>{t('anonymous.withoutSession.runtimeTruth')}</span>
              <span className="text-right text-[color:var(--pico-text)]">{t('anonymous.withoutSession.notTrustworthyYet')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t('anonymous.withoutSession.approvalsAndWebhooks')}</span>
              <span className="text-right text-[color:var(--pico-text)]">{t('anonymous.withoutSession.blocked')}</span>
            </div>
          </div>
          <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            {t('anonymous.withoutSession.body')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/login?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.primaryButton}>
              {t('anonymous.withoutSession.signIn')}
            </Link>
            <Link href={`/register?next=${encodeURIComponent(redirectPath)}`} className={picoClasses.secondaryButton}>
              {t('anonymous.withoutSession.createAccount')}
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
                {t('anonymous.withoutSession.continueWithProvider', { provider: provider.label })}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
