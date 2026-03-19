'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
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

  if (success) {
    return (
      <div className="site-page selection:bg-white/20">
        <main className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-6">
          <div className="site-form-shell">
            <div className="site-form-card p-8">
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <Mail className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-medium tracking-tight text-white">Check your email</h1>
                <p className="mt-3 text-white/62">
                  We&apos;ve sent password reset instructions to <span className="text-white">{email}</span>
                </p>
                <p className="mt-4 text-sm text-white/40">
                  Didn&apos;t receive the email? Check your spam folder, or{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="site-inline-link"
                  >
                    try again
                  </button>
                </p>
                <Link
                  href="/login"
                  className="mt-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="site-page selection:bg-white/20">
      <main className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-6">
        <div className="site-form-shell">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-white">Forgot password?</h1>
            <p className="mt-2 text-white/62">No worries, we&apos;ll send you reset instructions</p>
          </div>

          <div className="site-form-card p-8">
            <div className="relative">
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

                <button type="submit" disabled={loading} className="site-button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
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

              <p className="mt-6 text-center text-sm text-white/60">
                <Link href="/login" className="inline-flex items-center gap-1 site-inline-link">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
