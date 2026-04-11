'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Turnstile, { type BoundTurnstileObject } from 'react-turnstile'
import { useLocale, useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import styles from './WaitlistForm.module.css'

export type WaitlistFormProps = {
  source?: string
  compact?: boolean
  className?: string
}


export function WaitlistForm({ source = 'homepage', compact = false, className }: WaitlistFormProps) {
  const initialTurnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const locale = useLocale()
  const t = useTranslations('waitlistForm')
  const [email, setEmail] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState(t('successCheckInbox'))
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('')
  const [loadingTurnstileSiteKey, setLoadingTurnstileSiteKey] = useState(true)
  const turnstileRef = useRef<BoundTurnstileObject | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCount() {
      try {
        const response = await fetch('/api/newsletter', { cache: 'no-store' })
        if (!response.ok) return

        const payload = await response.json()
        const nextCount = Number(payload.count ?? 0)

        if (!cancelled) {
          setCount(Number.isFinite(nextCount) ? nextCount : 0)
        }
      } catch {
        if (!cancelled) {
          setCount(null)
        }
      }
    }

    void loadCount()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTurnstileSiteKey() {
      try {
        const response = await fetch('/api/turnstile/site-key', { cache: 'no-store' })
        const payload = await response.json()
        const nextSiteKey = typeof payload.siteKey === 'string' ? payload.siteKey.trim() : ''

        if (!cancelled) {
          setTurnstileSiteKey(nextSiteKey)
        }
      } catch {
        if (!cancelled) {
          setTurnstileSiteKey(initialTurnstileSiteKey)
        }
      } finally {
        if (!cancelled) {
          setLoadingTurnstileSiteKey(false)
        }
      }
    }

    void loadTurnstileSiteKey()

    return () => {
      cancelled = true
    }
  }, [initialTurnstileSiteKey])

  const resetTurnstile = () => {
    setCaptchaToken(null)
    turnstileRef.current?.reset()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!turnstileSiteKey) {
      setError(
        loadingTurnstileSiteKey
          ? t('verificationLoadingTryAgain')
          : t('verificationUnavailable')
      )
      return
    }

    if (!captchaToken) {
      setError(t('verificationRequired'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, locale, captchaToken, honeypot }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message || payload.error?.code || t('joinFailed'))
      }

      const alreadyJoined = Boolean(payload.alreadyJoined)
      const emailSent = payload.emailSent !== false

      setSuccess(true)
      setSuccessMessage(
        payload.message
          || (alreadyJoined
            ? t('alreadyJoined')
            : emailSent
              ? t('successCheckInbox')
              : t('success'))
      )

      if (!alreadyJoined) {
        setCount((current) => (current === null ? 1 : current + 1))
      }

      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('joinFailed'))
    } finally {
      resetTurnstile()
      setLoading(false)
    }
  }

  return (
    <div className={cn(styles.card, compact && styles.compact, className)}>
      <div>
        <div className={styles.topline}>
          <span className={styles.eyebrow}>Waitlist Live</span>
          <span className={styles.count}>
            {count === null ? 'Join the waitlist' : `${count.toLocaleString()} registered`}
          </span>
        </div>

        <div>
          <p className={styles.title}>Join the early access list</p>
          <p className={styles.body}>
            We’re opening hosted access in waves. Join the list for launch updates and priority invites.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.success}
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
            <div>
              <p>{successMessage}</p>
              <p className={styles.successNote}>{t('successNote')}</p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} data-testid={`waitlist-form-${source}`}>
            <input
              type="text"
              name="honeypot"
              className="hidden"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
            <label className="sr-only" htmlFor={`waitlist-email-${source}`}>Email address</label>
            <input
              id={`waitlist-email-${source}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className={styles.input}
            />

            {turnstileSiteKey ? (
              <Turnstile
                action="waitlist"
                appearance="always"
                className="min-h-[65px]"
                fixedSize
                onError={(_, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile ?? null
                  setCaptchaToken(null)
                  setError(t('verificationFailedRefresh'))
                }}
                onExpire={(_, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                  setCaptchaToken(null)
                  setError(t('verificationExpired'))
                }}
                onLoad={(_, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                }}
                onTimeout={(boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                  setCaptchaToken(null)
                  setError(t('verificationTimedOut'))
                }}
                onVerify={(token, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                  setCaptchaToken(token)
                  setError('')
                }}
                refreshExpired="auto"
                sitekey={turnstileSiteKey}
                size="flexible"
                theme="auto"
              />
            ) : (
              <div className={styles.turnstileFallback}>
                {loadingTurnstileSiteKey
                  ? t('verificationLoading')
                  : t('verificationUnavailable')}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken || !turnstileSiteKey}
              className={styles.button}
            >
              {loading ? t('submitting') : t('submit')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.error}
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
