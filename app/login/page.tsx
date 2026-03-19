'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.detail || payload.error?.message || payload.error || 'Login failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="site-page selection:bg-white/20">
      <main className="relative flex min-h-screen items-center justify-center px-5 py-24 sm:px-6">
        <div className="site-form-shell">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-white/62">Sign in to your account to continue</p>
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

                <div>
                  <label htmlFor="password" className="site-form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-white/60">
                <Link href="/forgot-password" className="site-inline-link">
                  Forgot password?
                </Link>
              </p>

              <p className="mt-6 text-center text-sm text-white/60">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="site-inline-link">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
