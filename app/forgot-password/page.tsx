'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'

import { AuthSurface } from '@/components/site/AuthSurface'

const authSurfaceProps = {
  eyebrow: 'Password recovery',
  title: 'Recover operator access without leaving the control surface.',
  description:
    'Use the email attached to your MUTX account and we will send a reset link. If hosted auth is not the lane you need today, the dashboard, docs, and install flow are still available.',
  asideEyebrow: 'Recovery notes',
  asideTitle: 'Keep the auth lane practical.',
  asideBody:
    'Reset flows should be simple, honest, and easy to verify. If the account does not exist or the hosted lane is unavailable, the rest of the public surface still tells the truth.',
  mediaSrc: '/landing/webp/reading-bench.webp',
  mediaAlt: 'MUTX robot reading and reviewing system state on a bench',
  mediaWidth: 1024,
  mediaHeight: 1536,
  highlights: [
    'Use the work email tied to the hosted operator account.',
    'Reset links expire, so handle the email quickly once it lands.',
    'Docs and dashboard stay available if you only need product truth right now.',
  ],
} as const

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
        throw new Error(payload.detail || payload.error?.message || payload.error || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSurface {...authSurfaceProps}>
      {success ? (
        <div className="flex flex-col items-start gap-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <Mail className="h-7 w-7 text-emerald-300" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
              Check your email
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
              We&apos;ve sent password reset instructions to <span className="text-white">{email}</span>.
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-muted)]">
              If the email does not show up, check spam or request another link.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="site-button-primary">
              Back to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => setSuccess(false)} className="site-button-secondary">
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
              Send reset instructions
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
              No drama. Just the email and a fresh link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="site-form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="site-input"
              />
            </div>

            {error && (
              <div className="site-status-error">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="site-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[color:var(--site-text-muted)] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      )}
    </AuthSurface>
  )
}
