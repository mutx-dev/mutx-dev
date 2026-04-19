'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'

import { AuthSurface } from '@/components/site/AuthSurface'
import styles from '@/components/site/marketing/MarketingCore.module.css'
import { isPicoHost } from '@/lib/auth/redirects'

export default function ForgotPasswordPage() {
  const t = useTranslations('pico.authRecovery.forgotPassword')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hostVariant, setHostVariant] = useState<'default' | 'pico'>('default')

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

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(
          payload.detail || payload.error?.message || payload.error || t('sendLink'),
        )
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendLink'))
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
    mediaSrc: '/landing/webp/reading-bench.webp',
    mediaAlt: 'MUTX robot reading and reviewing system state on a bench',
    mediaWidth: 1024,
    mediaHeight: 1536,
    highlights: [t('highlights.0'), t('highlights.1'), t('highlights.2')],
  } as const

  return (
    <AuthSurface {...authSurfaceProps} variant="recovery" hostVariant={hostVariant}>
      {success ? (
        <div className={styles.formWrap}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <Mail className="h-7 w-7 text-emerald-300" />
          </div>

          <div>
            <h2 className={styles.sectionTitle}>{t('successTitle')}</h2>
            <p className={styles.bodyText}>
              {t('successBody', { email })}
            </p>
            <p className={styles.bodyText}>
              {t('successHint')}
            </p>
          </div>

          <div className={styles.ctaRow}>
            <Link href="/login" className={styles.buttonPrimary}>
              {t('backToSignIn')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => setSuccess(false)} className={styles.buttonSecondary}>
              {t('tryAgain')}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.formWrap}>
          <div>
            <h2 className={styles.sectionTitle}>{t('sendTitle')}</h2>
            <p className={styles.bodyText}>
              {t('sendBody')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.formWrap}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.fieldLabel}>
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
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
                  {t('sending')}
                </>
              ) : (
                <>
                  {t('sendLink')}
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
      )}
    </AuthSurface>
  )
}
