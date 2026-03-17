'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Turnstile, { type BoundTurnstileObject } from 'react-turnstile'

import { cn } from '@/lib/utils'

export type WaitlistFormProps = {
  source?: string
  compact?: boolean
  className?: string
}


export function WaitlistForm({ source = 'homepage', compact = false, className }: WaitlistFormProps) {
  const initialTurnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const [email, setEmail] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("You're on the list. Check your inbox.")
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
          ? 'Verification is still loading. Please try again in a moment.'
          : 'Waitlist verification is unavailable right now. Please try again later.'
      )
      return
    }

    if (!captchaToken) {
      setError('Please complete the verification challenge.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, captchaToken, honeypot }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message || payload.error?.code || 'Failed to join waitlist')
      }

      const alreadyJoined = String(payload.message || '').toLowerCase().includes('already')
      const emailSent = payload.emailSent !== false

      setSuccess(true)
      setSuccessMessage(
        alreadyJoined
          ? payload.message || "You're already on the list!"
          : payload.message
            || (emailSent
              ? "You're on the list. Check your inbox."
              : "You're on the list.")
      )

      if (!alreadyJoined) {
        setCount((current) => (current === null ? 1 : current + 1))
      }

      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join waitlist')
    } finally {
      resetTurnstile()
      setLoading(false)
    }
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6 shadow-xl', compact && 'p-4 sm:p-5', className)}>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="eyebrow">Waitlist Live</span>
          <span className="text-sm text-white/60">
            {count === null ? 'Join the waitlist' : `${count.toLocaleString()} registered`}
          </span>
        </div>

        <div className="space-y-1 mb-6">
          <p className="text-lg font-medium text-white sm:text-xl">Join the early access list</p>
          <p className="text-sm text-white/60">
            We’re opening hosted access in waves. Join the list for launch updates and priority invites.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
            <div>
              <p className="font-medium text-sm">{successMessage}</p>
              <p className="mt-1 text-xs text-white/60">We&apos;ll be in touch soon.</p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3" data-testid={`waitlist-form-${source}`}>
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
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors"
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
                  setError('Verification failed. Please refresh the challenge and try again.')
                }}
                onExpire={(_, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                  setCaptchaToken(null)
                  setError('Verification expired. Please complete the challenge again.')
                }}
                onLoad={(_, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                }}
                onTimeout={(boundTurnstile) => {
                  turnstileRef.current = boundTurnstile
                  setCaptchaToken(null)
                  setError('Verification timed out. Please complete the challenge again.')
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
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {loadingTurnstileSiteKey
                  ? 'Loading verification challenge...'
                  : 'Waitlist verification is unavailable right now. Please try again later.'}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken || !turnstileSiteKey}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Request Access'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
