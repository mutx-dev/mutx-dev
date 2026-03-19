'use client'

import { useState } from 'react'
import Image from 'next/image'
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
      <div className="min-h-screen bg-black text-white selection:bg-white/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.06),transparent_32%),linear-gradient(180deg,#050505_0%,#000_55%,#050505_100%)]" />

        <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">MUTX</span>
            </Link>
          </div>
        </nav>

        <main className="relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-6">
          <div className="w-full max-w-md">
            <div className="panel relative overflow-hidden rounded-[28px] border border-white/10 p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_26%)] opacity-80" />
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
                    className="text-white hover:underline"
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
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.06),transparent_32%),linear-gradient(180deg,#050505_0%,#000_55%,#050505_100%)]" />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">MUTX</span>
          </Link>
        </div>
      </nav>

      <main className="relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-white">Forgot password?</h1>
            <p className="mt-2 text-white/62">No worries, we&apos;ll send you reset instructions</p>
          </div>

          <div className="panel relative overflow-hidden rounded-[28px] border border-white/10 p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_26%)] opacity-80" />
            <div className="relative">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
                <Link href="/login" className="inline-flex items-center gap-1 text-white hover:underline">
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
