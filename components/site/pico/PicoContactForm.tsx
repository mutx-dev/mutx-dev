'use client'

import { useState, useCallback, useRef, type FormEvent } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, ArrowRight, Check } from 'lucide-react'

import s from './PicoContactForm.module.css'

type PicoContactFormProps = {
  open: boolean
  onClose: () => void
  defaultTier?: string
}

export function PicoContactForm({ open, onClose, defaultTier }: PicoContactFormProps) {
  const prefersReducedMotion = useReducedMotion()
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const honeypotRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (state === 'submitting') return

      // Honeypot
      if (honeypotRef.current?.value) return

      setState('submitting')
      setErrorMsg('')

      const form = new FormData(e.currentTarget)
      const payload = {
        email: form.get('email') as string,
        name: form.get('name') as string,
        company: form.get('company') as string,
        message: form.get('message') as string,
        tier: form.get('tier') as string,
        source: 'pico-landing',
        honeypot: honeypotRef.current?.value || '',
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok || data.status === 'error') {
          const msg = data.error?.message || 'Something went wrong. Please try again.'
          setErrorMsg(msg)
          setState('error')
          return
        }

        setState('success')
      } catch {
        setErrorMsg('Network error. Please try again.')
        setState('error')
      }
    },
    [state],
  )

  const handleClose = useCallback(() => {
    if (state === 'submitting') return
    setState('idle')
    setErrorMsg('')
    onClose()
  }, [state, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.overlay}
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            className={s.modal}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Contact form"
          >
            <button
              className={s.closeBtn}
              onClick={handleClose}
              aria-label="Close"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            {state === 'success' ? (
              <div className={s.successState}>
                <span className={s.successIcon}>
                  <Check className="h-6 w-6" />
                </span>
                <h2 className={s.successTitle}>You&apos;re in.</h2>
                <p className={s.successBody}>
                  We read every message. Expect a reply within 24 hours.
                </p>
                <button className={s.successBtn} onClick={handleClose} type="button">
                  Back to the page
                </button>
              </div>
            ) : (
              <>
                <div className={s.header}>
                  <h2 className={s.title}>Get early access</h2>
                  <p className={s.subtitle}>
                    Tell us about your setup. We&apos;ll get you running.
                  </p>
                </div>

                <form className={s.form} onSubmit={handleSubmit}>
                  {/* Honeypot */}
                  <input
                    ref={honeypotRef}
                    name="website"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className={s.honeypot}
                  />

                  <div className={s.row}>
                    <label className={s.label}>
                      <span className={s.labelText}>Work email</span>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        className={s.input}
                        autoComplete="email"
                      />
                    </label>
                  </div>

                  <div className={s.row2}>
                    <label className={s.label}>
                      <span className={s.labelText}>Name</span>
                      <input
                        name="name"
                        type="text"
                        placeholder="Jane Smith"
                        className={s.input}
                        autoComplete="name"
                      />
                    </label>
                    <label className={s.label}>
                      <span className={s.labelText}>Company</span>
                      <input
                        name="company"
                        type="text"
                        placeholder="Acme Inc."
                        className={s.input}
                        autoComplete="organization"
                      />
                    </label>
                  </div>

                  <label className={s.label}>
                    <span className={s.labelText}>Interested in</span>
                    <select name="tier" className={s.select} defaultValue={defaultTier || 'pro'}>
                      <option value="starter">Starter — €49/mo (1 agent)</option>
                      <option value="pro">Pro — €149/mo (5 agents)</option>
                      <option value="team">Team — €399/mo (20 agents)</option>
                      <option value="enterprise">Enterprise — custom</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </label>

                  <label className={s.label}>
                    <span className={s.labelText}>
                      Anything we should know? <span className={s.optional}>(optional)</span>
                    </span>
                    <textarea
                      name="message"
                      rows={3}
                      placeholder="E.g. I have 3 LangChain agents running in production..."
                      className={s.textarea}
                    />
                  </label>

                  {errorMsg && <p className={s.error}>{errorMsg}</p>}

                  <button
                    type="submit"
                    className={s.submit}
                    disabled={state === 'submitting'}
                  >
                    {state === 'submitting' ? (
                      'Sending...'
                    ) : (
                      <>
                        Send request
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className={s.disclaimer}>
                    No spam. No sales calls. Just a human reply.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
