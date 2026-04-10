'use client'

import { type FormEvent, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import s from './PicoLanding.module.css'

type PicoPreRegFormProps = {
  className?: string
}

export function PicoPreRegForm({ className }: PicoPreRegFormProps) {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'pico-landing:pre-registration',
          honeypot,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      const errorMessage =
        payload?.error?.message ||
        payload?.detail ||
        (typeof payload?.error === 'string' ? payload.error : null) ||
        'Something went wrong. Please try again.'

      if (!response.ok) {
        throw new Error(errorMessage)
      }

      setEmail('')
      setSuccess(
        payload?.message ||
          "You're on the list. We'll be in touch when access opens.",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(s.formWrap, className)}>
      {success ? (
        <div className={s.formSuccess}>
          <CheckCircle2 className={s.formSuccessIcon} />
          <div>
            <p className={s.formSuccessTitle}>You are on the list.</p>
            <p className={s.formSuccessBody}>
              We will be in touch when PicoMUTX access opens. No spam, no payment
              required.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={s.form} noValidate>
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className={s.formHoneypot}
            aria-hidden="true"
          />

          <div className={s.formRow}>
            <label htmlFor="pico-email" className={s.formLabel}>
              Work email
            </label>
            <input
              id="pico-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={s.formInput}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && (
            <div className={s.formError}>
              <AlertCircle className={s.formErrorIcon} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={s.formButton}
          >
            {loading ? (
              <>
                <Loader2 className={s.formButtonSpinner} />
                Joining…
              </>
            ) : (
              'Pre-Register Now'
            )}
          </button>

          <p className={s.formPrivacy}>
            No spam. No payment required. Just early access updates and launch
            details.
          </p>
        </form>
      )}
    </div>
  )
}
