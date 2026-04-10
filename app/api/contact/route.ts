import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateData, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, badRequest } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL?.trim() || 'MUTX <hello@mutx.dev>'
const notifyEmail =
  process.env.CONTACT_NOTIFY_EMAIL?.trim() || 'hello@mutx.dev'
const resend = resendApiKey ? new Resend(resendApiKey) : null

async function sendNotificationEmail(data: {
  email: string
  name?: string
  company?: string
  message?: string
  tier?: string
  source: string
}) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const subject = data.company
    ? `New PicoMUTX lead: ${data.name || data.email} @ ${data.company}`
    : `New PicoMUTX lead: ${data.name || data.email}`

  const lines = [
    `Source: ${data.source}`,
    `Email: ${data.email}`,
    data.name ? `Name: ${data.name}` : null,
    data.company ? `Company: ${data.company}` : null,
    data.tier ? `Interested tier: ${data.tier}` : null,
    data.message ? `\nMessage:\n${data.message}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const result = await resend.emails.send({
    from: resendFromEmail,
    to: [notifyEmail],
    subject,
    text: lines,
  })

  if (result.error) {
    throw new Error(result.error.message || 'Resend email send failed')
  }

  return result
}

async function sendConfirmationEmail(to: string) {
  if (!resend) return

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: [to],
      subject: 'We got your request — PicoMUTX',
      text: `Thanks for reaching out. We read every message and will get back to you within 24 hours.\n\n— The MUTX team`,
    })
  } catch {
    // non-fatal — notification already sent
    console.error('Contact confirmation email failed')
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json().catch(() => ({}))
    const { name, company, message, tier, source, honeypot } = body

    // Honeypot
    if (honeypot) {
      return badRequest('Invalid input')
    }

    // Validate
    const validation = await validateData(schemas.lead, body)
    if (!validation.success) {
      return validation.response
    }

    const normalizedEmail = validation.data.email.toLowerCase().trim()
    const normalizedSource = String(source || 'pico-landing').trim().slice(0, 120)
    const normalizedTier = tier ? String(tier).trim().slice(0, 50) : undefined

    // Send notification to team
    let notified = false
    if (resend) {
      try {
        await sendNotificationEmail({
          email: normalizedEmail,
          name: name?.trim(),
          company: company?.trim(),
          message: message?.trim(),
          tier: normalizedTier,
          source: normalizedSource,
        })
        notified = true
      } catch (err) {
        console.error('Contact notification email failed:', err)
      }
    } else {
      console.warn('Contact form: Resend not configured, skipping email')
    }

    // Send confirmation to user
    await sendConfirmationEmail(normalizedEmail)

    return NextResponse.json({
      success: true,
      message: notified
        ? "Got it. We'll be in touch within 24 hours."
        : "Got it. We'll be in touch soon.",
      notified,
    })
  })(request)
}
