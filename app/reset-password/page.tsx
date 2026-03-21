'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react'

import { AuthSurface } from '@/components/site/AuthSurface'

const authSurfaceProps = {
  eyebrow: 'Reset password',
  title: 'Set a fresh password and get back to the operator lane.',
  description:
    'Use a strong password, confirm it cleanly, and finish the reset without guessing whether the flow worked.',
  asideEyebrow: 'Reset rules',
  asideTitle: 'Keep the recovery path boring.',
  asideBody:
    'Password resets should be plain, fast, and easy to verify. Strong form states matter more than ornamental auth theater.',
  mediaSrc: '/landing/webp/thumbs-up-portrait.webp',
  mediaAlt: 'MUTX robot giving a thumbs-up once the reset path is complete',
  mediaWidth: 900,
  mediaHeight: 1350,
  highlights: [
    'Reset links are token-based, so an expired or missing token should fail honestly.',
    'Use a password that clears your own security bar, not just the minimum validator.',
    'If hosted auth is not your current path, docs and dashboard remain visible while the lane hardens.',
  ],
} as const

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenError(true)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
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
        throw new Error(payload.detail || payload.error?.message || payload.error || 'Failed to reset password')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (tokenError) {
    return (
      <AuthSurface {...authSurfaceProps}>
        <div className="flex flex-col items-start gap-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10">
            <AlertCircle className="h-7 w-7 text-rose-300" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
              Invalid reset link
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
              This password reset link is missing, invalid, or already expired.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/forgot-password" className="site-button-primary">
              Request a new link
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="site-button-secondary">
              Back to sign in
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AuthSurface>
    )
  }

  if (success) {
    return (
      <AuthSurface {...authSurfaceProps}>
        <div className="flex flex-col items-start gap-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <Lock className="h-7 w-7 text-emerald-300" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
              Password reset complete
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
              Your password has been updated. The sign-in lane can use the new credentials now.
            </p>
          </div>

          <Link href="/login" className="site-button-primary">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AuthSurface>
    )
  }

  return (
    <AuthSurface {...authSurfaceProps}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">
            Choose a new password
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
            Keep it strong, confirm it once, and the form will do the rest.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="site-form-label">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="site-input"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="site-form-label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
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
                Resetting...
              </>
            ) : (
              <>
                Reset password
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
    </AuthSurface>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="site-page">
          <main className="site-main flex min-h-screen items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
