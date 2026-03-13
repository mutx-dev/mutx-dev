'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react'

import { cn } from '@/lib/utils'

type ContactLeadFormProps = {
  source?: string
  className?: string
}

const INQUIRY_TYPES = [
  { value: 'funding', label: 'Funding' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'contributions', label: 'Contributions' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'demo-hosted-access', label: 'Demo / hosted access' },
  { value: 'general', label: 'General' },
] as const

const MESSAGE_PLACEHOLDERS: Record<string, string> = {
  funding: 'What kind of financing conversation is relevant, what stage are you evaluating, and what part of the MUTX roadmap matters most?',
  partnerships: 'Describe the partnership, distribution, infrastructure, enterprise, or integration angle you want to explore.',
  contributions: 'Tell us what you want to contribute: code, docs, design, infrastructure, GTM support, or ecosystem work.',
  ideas: 'Share the product idea, operator workflow, feature gap, or design-partner use case you think MUTX should support.',
  'demo-hosted-access': 'Tell us what you need to see in a live demo or hosted evaluation, and what environment or workflow you are trying to validate.',
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
      if (!response.ok) {
        throw new Error(payload.detail || payload.error || 'Failed to send contact request')
      }

      setInquiryType('general')
      setEmail('')
      setName('')
      setOrganization('')
      setMessage('')
      setSuccess('Message received. The right MUTX lane will follow up.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contact request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-xl', className)}>
      <div className="mb-5">
        <div className="eyebrow mb-3">Institutional contact</div>
        <h2 className="text-2xl font-medium text-white">Send a structured inquiry</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Use one slim form for funding, partnerships, contributions, ideas, demos, or general inbound.
        </p>
      </div>

      {success ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">{success}</p>
            <p className="mt-1 text-sm text-emerald-100/70">If it is urgent, email hello@mutx.dev directly.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
          />

          <label className="block text-sm text-white/70">
            <span className="mb-2 block">Inquiry type</span>
            <select
              required
              value={inquiryType}
              onChange={(event) => setInquiryType(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              {INQUIRY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              <span className="mb-2 block">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>

            <label className="block text-sm text-white/70">
              <span className="mb-2 block">Work email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>
          </div>

          <label className="block text-sm text-white/70">
            <span className="mb-2 block">Organization</span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Firm, company, studio, or fund"
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </label>

          <label className="block text-sm text-white/70">
            <span className="mb-2 block">Message</span>
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={MESSAGE_PLACEHOLDERS[inquiryType]}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </label>

          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-rose-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Sending…' : 'Send inquiry'}
          </button>
        </form>
      )}
    </div>
  )
}
