'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export type WaitlistFormProps = {
  source?: string
  compact?: boolean
  className?: string
}

export function WaitlistForm({ source = 'homepage', compact = false, className }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("You're on the list. Check your inbox.")
  const [error, setError] = useState('')

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to join waitlist')
      }

      const alreadyJoined = String(payload.message || '').toLowerCase().includes('already')
      const emailSent = payload.emailSent !== false

      setSuccess(true)
      setSuccessMessage(
        alreadyJoined
          ? payload.message || "You're already on the list!"
          : emailSent
            ? payload.message || "You're on the list. Check your inbox."
            : "You're on the list. Email delivery is not configured in this environment yet."
      )

      if (!alreadyJoined) {
        setCount((current) => (current === null ? 1 : current + 1))
      }

      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('panel relative overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-6', compact && 'p-4 sm:p-5', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1),transparent_34%)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow !py-1.5">Waitlist is live</span>
          <span className="stat-pill">
            {count === null ? 'Postgres-backed signup' : `${count.toLocaleString()} builders in`}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-white sm:text-xl">Get launch drops, contributor invites, and early access.</p>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Signups are stored in Postgres and confirmation emails are sent through Resend.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-emerald-100"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="mt-1 text-sm text-emerald-100/80">We will send launch updates, docs, and contributor calls to that inbox.</p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex w-full flex-col gap-3 lg:flex-row">
            <label className="sr-only" htmlFor={`waitlist-email-${source}`}>Email address</label>
            <input
              id={`waitlist-email-${source}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-cyan-200 to-amber-200 px-7 py-4 text-base font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join the waitlist'}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        )}

        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 text-sm text-rose-300"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
