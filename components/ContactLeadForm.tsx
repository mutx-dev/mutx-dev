'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react'

import { cn } from '@/lib/utils'
import marketing from '@/components/site/marketing/MarketingCore.module.css'

type ContactLeadFormProps = {
  source?: string
  className?: string
}

const INQUIRY_TYPES = [
  { value: 'demo-hosted-access', label: 'Hosted evaluation' },
  { value: 'ideas', label: 'Design partner / workflow' },
  { value: 'partnerships', label: 'Partnership / infrastructure' },
  { value: 'contributions', label: 'Contributions' },
  { value: 'funding', label: 'Strategic / funding' },
  { value: 'general', label: 'General' },
] as const

const MESSAGE_PLACEHOLDERS: Record<string, string> = {
  funding: 'What kind of financing conversation is relevant, what stage are you evaluating, and what part of the MUTX roadmap matters most?',
  partnerships: 'Describe the partnership, infrastructure, integration, or distribution angle you want to explore.',
  contributions: 'Tell us what you want to contribute: code, docs, design, infrastructure, GTM support, or ecosystem work.',
  ideas: 'Share the workflow, feature gap, or design-partner use case you think MUTX should support.',
  'demo-hosted-access': 'Tell us what you need to validate in a hosted evaluation and which deployment, auth, or runtime workflow matters most.',
  general: 'Summarize the context, what you need, and how MUTX can help.',
}

export function ContactLeadForm({ source = 'contact-page', className }: ContactLeadFormProps) {
  const [inquiryType, setInquiryType] = useState('general')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inquiryLabel = useMemo(
    () => INQUIRY_TYPES.find((item) => item.value === inquiryType)?.label ?? 'General',
    [inquiryType],
  )

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
          name,
          company: organization,
          message: `Inquiry type: ${inquiryLabel}\n\n${message.trim()}`,
          source: `${source}:${inquiryType}`,
          honeypot,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      const errorMessage =
        payload?.error?.message ||
        payload?.detail ||
        (typeof payload?.error === 'string' ? payload.error : null) ||
        'Failed to send contact request'

      if (!response.ok) {
        throw new Error(errorMessage)
      }

      setInquiryType('general')
      setEmail('')
      setName('')
      setOrganization('')
      setMessage('')
      setSuccess(payload?.message || 'Message received. The MUTX team will follow up.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contact request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="contact-lead-form" className={cn(marketing.panel, marketing.panelPadded, className)}>
      {success ? (
        <div className={marketing.success}>
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">{success}</p>
            <p className="mt-1 text-sm">If it is urgent, email hello@mutx.dev directly.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={marketing.formWrap}>
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
          />

          <label className={marketing.field}>
            <span className={marketing.fieldLabel}>Inquiry type</span>
            <select
              required
              value={inquiryType}
              onChange={(event) => setInquiryType(event.target.value)}
              className={marketing.select}
            >
              {INQUIRY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={marketing.field}>
              <span className={marketing.fieldLabel}>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className={marketing.input}
              />
            </label>

            <label className={marketing.field}>
              <span className={marketing.fieldLabel}>Work email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className={marketing.input}
              />
            </label>
          </div>

          <label className={marketing.field}>
            <span className={marketing.fieldLabel}>Organization</span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Firm, company, studio, or fund"
              className={marketing.input}
            />
          </label>

          <label className={marketing.field}>
            <span className={marketing.fieldLabel}>Message</span>
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={MESSAGE_PLACEHOLDERS[inquiryType]}
              rows={6}
              className={marketing.textarea}
            />
          </label>

          {error ? (
            <div className={marketing.error}>
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`${marketing.buttonPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Sending…' : 'Send inquiry'}
          </button>
        </form>
      )}
    </div>
  )
}
