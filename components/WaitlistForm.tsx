'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to join waitlist')
      }

      setSuccess(true)
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {success ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-200 shadow-lg"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-base font-medium">You're on the list. Check your inbox.</span>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-6 py-4 text-base text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Joining...' : 'Get Early Access'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      )}
      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-2 text-sm text-rose-400"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}
    </div>
  )
}
