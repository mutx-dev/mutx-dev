'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

import { extractApiErrorMessage } from '@/components/app/http'
import {
  picoClasses,
  picoPanel,
  picoEmber,
  picoNote,
} from '@/components/pico/picoTheme'
import { buildOAuthStartHref, oauthProviders } from '@/lib/auth/oauth'
import { resolveRedirectPath } from '@/lib/auth/redirects'

type AuthMode = 'login' | 'register'

type PicoAuthPageProps = {
  mode: AuthMode
  nextPath?: string | null
  fallbackPath?: string
  initialError?: string | null
  initialEmail?: string | null
}

const contentByMode = {
  login: {
    title: 'Enter the current Pico build',
    subtitle: 'Use a provider or email to open the preview and save your place.',
    submitLabel: 'Enter Pico',
    loadingLabel: 'Opening Pico',
    togglePrompt: 'Need access?',
    toggleAction: 'Create one',
    toggleMode: 'register' as AuthMode,
  },
  register: {
    title: 'Create your Pico preview account',
    subtitle:
      'Sign up once, save your place, and keep following the product as it improves.',
    submitLabel: 'Create preview account',
    loadingLabel: 'Creating preview account',
    togglePrompt: 'Already have an account?',
    toggleAction: 'Sign in',
    toggleMode: 'login' as AuthMode,
  },
}

function buildAuthHref(mode: AuthMode, nextPath: string) {
  return `/${mode}?next=${encodeURIComponent(nextPath)}`
}

const inputClass =
  'w-full rounded-[14px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-input)] px-4 py-2.5 text-sm text-[color:var(--pico-text)] placeholder:text-[color:var(--pico-text-muted)] outline-none transition duration-200 focus:border-[color:var(--pico-border-hover)] focus:shadow-[0_0_0_3px_rgba(var(--pico-accent-rgb),0.12)]'

export function PicoAuthPage({
  mode,
  nextPath,
  fallbackPath = '/',
  initialError,
  initialEmail,
}: PicoAuthPageProps) {
  const router = useRouter()
  const content = contentByMode[mode]
  const isRegister = mode === 'register'
  const redirectPath = resolveRedirectPath(nextPath, fallbackPath)

  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(initialError ?? '')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)

  const verificationError = /verification/i.test(error)

  /* ------------------------------------------------------------------ */
  /*  Auth logic — identical to AuthPage.tsx lines 159–266               */
  /* ------------------------------------------------------------------ */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')
    setNotice('')

    try {
      const payload =
        mode === 'login' ? { email, password } : { email, password, name }

      const response = await fetch(
        mode === 'login' ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      const responsePayload = await response.json().catch(() => ({
        detail:
          mode === 'login' ? 'Failed to sign in' : 'Failed to create account',
      }))

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage(
            responsePayload,
            mode === 'login' ? 'Failed to sign in' : 'Failed to create account',
          ),
        )
      }

      if (isRegister && responsePayload.requires_email_verification) {
        const verificationParams = new URLSearchParams({
          email,
          next: redirectPath,
        })
        router.replace(`/verify-email?${verificationParams.toString()}`)
        router.refresh()
        return
      }

      router.replace(redirectPath)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === 'login'
            ? 'Failed to sign in'
            : 'Failed to create account',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError('Enter your email address first')
      return
    }

    setResendingVerification(true)
    setNotice('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json().catch(() => ({
        detail: 'Failed to resend verification email',
      }))

      if (!response.ok) {
        throw new Error(
          extractApiErrorMessage(
            payload,
            'Failed to resend verification email',
          ),
        )
      }

      setNotice(payload.message || 'Verification email sent')
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Failed to resend verification email',
      )
    } finally {
      setResendingVerification(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="pico-root min-h-screen flex flex-col">
      {/* ---- Minimal top nav ---- */}
      <header className="w-full px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center">
          <Link
            href="/"
            className="font-[family:var(--font-site-display)] text-lg tracking-[-0.04em] text-[color:var(--pico-text)] transition duration-200 hover:text-[color:var(--pico-accent)]"
          >
            PicoMUTX
          </Link>
        </div>
      </header>

      {/* ---- Centered auth panel ---- */}
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:pt-14">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <p className={picoClasses.monoLabel}>Pico preview access</p>
            <h1
              className={`${picoClasses.title} mt-3 text-2xl leading-tight sm:text-3xl`}
            >
              {content.title}
            </h1>
            <p className={`${picoClasses.body} mt-3`}>{content.subtitle}</p>
          </div>

          {/* Card */}
          <div className={picoPanel('p-6 sm:p-8')}>
            {/* OAuth providers — 2x2 grid on desktop */}
            <div className="grid grid-cols-2 gap-2.5">
              {oauthProviders.map((provider) => (
                <Link
                  key={provider.id}
                  href={buildOAuthStartHref(provider.id, mode, redirectPath)}
                  prefetch={false}
                  className={picoClasses.secondaryButton}
                >
                  {provider.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[color:var(--pico-border)]" />
              <span className={picoClasses.monoLabel}>Or use email</span>
              <span className="h-px flex-1 bg-[color:var(--pico-border)]" />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isRegister ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pico-name" className={picoClasses.label}>
                    Name
                  </label>
                  <input
                    id="pico-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pico-email" className={picoClasses.label}>
                  Email address
                </label>
                <input
                  id="pico-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pico-password" className={picoClasses.label}>
                  Password
                </label>
                <input
                  id="pico-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  className={inputClass}
                />
              </div>

              {isRegister ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="pico-confirm-password"
                    className={picoClasses.label}
                  >
                    Confirm password
                  </label>
                  <input
                    id="pico-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
              ) : null}

              {/* Success notice */}
              {notice ? (
                <div
                  className={picoNote('flex items-start gap-2.5')}
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--pico-accent)]" />
                  <span>{notice}</span>
                </div>
              ) : null}

              {/* Error alert */}
              {error ? (
                <div
                  className={picoEmber('flex items-start gap-2.5 px-4 py-3.5')}
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--pico-accent)]" />
                  <span className="text-sm leading-6 text-[color:var(--pico-text)]">
                    {error}
                  </span>
                </div>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`${picoClasses.primaryButton} mt-1 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {content.loadingLabel}
                  </>
                ) : (
                  <>
                    {content.submitLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Utility links */}
            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[color:var(--pico-text-muted)]">
              {mode === 'login' ? (
                <>
                  <Link href="/forgot-password" className={picoClasses.link}>
                    Forgot password?
                  </Link>
                  {verificationError ? (
                    <button
                      type="button"
                      onClick={() => void handleResendVerification()}
                      disabled={resendingVerification}
                      className={picoClasses.link}
                    >
                      {resendingVerification
                        ? 'Sending verification…'
                        : 'Resend verification'}
                    </button>
                  ) : null}
                  <p>
                    {content.togglePrompt}{' '}
                    <Link
                      href={buildAuthHref(content.toggleMode, redirectPath)}
                      className={picoClasses.link}
                    >
                      {content.toggleAction}
                    </Link>
                  </p>
                </>
              ) : (
                <p>
                  {content.togglePrompt}{' '}
                  <Link
                    href={buildAuthHref(content.toggleMode, redirectPath)}
                    className={picoClasses.link}
                  >
                    {content.toggleAction}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
