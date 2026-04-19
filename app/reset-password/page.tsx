'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react'

import { AuthSurface } from '@/components/site/AuthSurface'
import styles from '@/components/site/marketing/MarketingCore.module.css'
import { isPicoHost } from '@/lib/auth/redirects'

function ResetPasswordForm() {
  const t = useTranslations('pico.authRecovery.resetPassword')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [hostVariant, setHostVariant] = useState<'default' | 'pico'>('default')

  useEffect(() => {
    if (!token) {
      setTokenError(true)
    }
  }, [token])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setHostVariant(isPicoHost(window.location.hostname) ? 'pico' : 'default')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError(t('passwordsMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(
          payload.detail || payload.error?.message || payload.error || t('resetPassword'),
        )
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword'))
    } finally {
      setLoading(false)
    }
  }

  const authSurfaceProps = {
    eyebrow: t('eyebrow'),
    title: t('title'),
    description: t('description'),
    asideEyebrow: t('asideEyebrow'),
    asideTitle: t('asideTitle'),
    asideBody: t('asideBody'),
    mediaSrc: '/landing/webp/thumbs-up-portrait.webp',
    mediaAlt: 'MUTX robot giving a thumbs-up once the reset path is complete',
    mediaWidth: 900,
    mediaHeight: 1350,
    highlights: [t('highlights.0'), t('highlights.1'), t('highlights.2')],
  } as const

  if (tokenError) {
    return (
      <AuthSurface {...authSurfaceProps} variant="recovery" hostVariant={hostVariant}>
        <div className={styles.formWrap}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10">
            <AlertCircle className="h-7 w-7 text-rose-300" />
          </div>

          <div>
            <h2 className={styles.sectionTitle}>{t('invalidTitle')}</h2>
            <p className={styles.bodyText}>
              {t('invalidBody')}
            </p>
          </div>

          <div className={styles.ctaRow}>
            <Link href="/forgot-password" className={styles.buttonPrimary}>
              {t('requestNewLink')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={styles.buttonSecondary}>
              {t('backToSignIn')}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AuthSurface>
    )
  }

  if (success) {
    return (
      <AuthSurface {...authSurfaceProps} variant="recovery" hostVariant={hostVariant}>
        <div className={styles.formWrap}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <Lock className="h-7 w-7 text-emerald-300" />
          </div>

          <div>
            <h2 className={styles.sectionTitle}>{t('completeTitle')}</h2>
            <p className={styles.bodyText}>
              {t('completeBody')}
            </p>
          </div>

          <Link href="/login" className={styles.buttonPrimary}>
            {t('signIn')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AuthSurface>
    )
  }

  return (
    <AuthSurface {...authSurfaceProps} variant="recovery" hostVariant={hostVariant}>
      <div className={styles.formWrap}>
        <div>
          <h2 className={styles.sectionTitle}>{t('formTitle')}</h2>
          <p className={styles.bodyText}>
            {t('formBody')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formWrap}>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.fieldLabel}>
              {t('newPassword')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.fieldLabel}>
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

            <button type="submit" disabled={loading} className={`${styles.buttonPrimary} w-full disabled:cursor-not-allowed disabled:opacity-60`}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('resetting')}
                </>
              ) : (
                <>
                  {t('resetPassword')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <Link href="/login" className={styles.inlineLink}>
            <ArrowLeft className="h-4 w-4" />
            {t('backToSignIn')}
          </Link>
        </div>
      </AuthSurface>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <main className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
