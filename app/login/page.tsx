'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Command, Loader2, Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const { login, loading, error } = useAuth()
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'email') {
      setEmailError(validateEmail(email))
    } else if (field === 'password') {
      setPasswordError(password ? '' : 'Password is required')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailValidation = validateEmail(email)
    const passwordValidation = password ? '' : 'Password is required'
    setEmailError(emailValidation)
    setPasswordError(passwordValidation)
    setTouched({ email: true, password: true })

    if (emailValidation || passwordValidation) return

    try {
      await login(email, password)
      router.push('/app')
    } catch {
      // Error is handled by the context
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030307] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[25%] w-[25%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-cyan-400/10 transition-transform hover:scale-105">
              <Command className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            </div>
            <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your MUTX control plane
            </p>
          </div>

          <form className="mt-8 space-y-5 sm:space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-8 backdrop-blur-xl">
          {(error || emailError || passwordError) && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-400/30" />
              {passwordError || emailError || error}
            </div>
          )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1.5 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className={`h-4 w-4 ${touched.email && !emailError && email ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (touched.email) setEmailError(validateEmail(e.target.value))
                    }}
                    onBlur={() => handleBlur('email')}
                    className={`block w-full rounded-xl border bg-black/20 py-3.5 sm:py-3 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                      touched.email && emailError 
                        ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/20' 
                        : touched.email && !emailError && email
                        ? 'border-emerald-400/50 focus:border-emerald-400/50 focus:ring-emerald-400/20'
                        : 'border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/20'
                    }`}
                    placeholder="you@example.com"
                  />
                  {touched.email && !emailError && email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-2">
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-1.5 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (touched.password) setPasswordError(e.target.value ? '' : 'Password is required')
                    }}
                    onBlur={() => handleBlur('password')}
                    className={`block w-full rounded-xl border bg-black/20 py-3.5 sm:py-3 pl-12 pr-12 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                      touched.password && passwordError
                        ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/20'
                        : touched.password && password
                        ? 'border-emerald-400/50 focus:border-emerald-400/50 focus:ring-emerald-400/20'
                        : 'border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/20'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-2 -mr-2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center py-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-black/20 text-cyan-400 focus:ring-cyan-400/20 focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                  Remember me for 30 days
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 sm:py-3.5 text-base sm:text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-400/20 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-[#030307] disabled:opacity50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors py-2 inline-block">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
