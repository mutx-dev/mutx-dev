import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { POST as captureLeadPost } from '@/app/api/leads/route'
import { validateData, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, badRequest } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL?.trim() || 'MUTX <hello@mutx.dev>'
const notifyEmail =
  process.env.CONTACT_NOTIFY_EMAIL?.trim() || 'hello@mutx.dev'
const resendAudienceId = process.env.RESEND_AUDIENCE_ID?.trim()
const discordWebhookUrl = process.env.LEAD_DISCORD_WEBHOOK_URL?.trim() || process.env.DISCORD_LEAD_WEBHOOK_URL?.trim()
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

async function sendConfirmationEmail(
  to: string,
  _name?: string,
  _company?: string,
) {
  if (!resend) return

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: [to],
      template: { id: '76afba66-9948-419d-9df2-ae9414006859' },
      headers: { 'X-Entity-Ref-ID': `pico-waitlist-${Date.now()}` },
    })
  } catch {
    // non-fatal — notification already sent
    console.error('Contact confirmation email failed')
  }
}

async function syncResendAudienceContact(data: {
  email: string
  name?: string
  company?: string
  source: string
}) {
  if (!resend || !resendAudienceId) return

  try {
    await resend.contacts.create({
      audienceId: resendAudienceId,
      email: data.email,
      firstName: data.name || undefined,
      lastName: data.company || undefined,
    })
  } catch (err) {
    // Non-fatal — contact may already exist (409) or audience not configured
    console.error('Resend audience sync failed:', err)
  }
}

async function notifyDiscord(data: {
  email: string
  name?: string
  company?: string
  message?: string
  tier?: string
  source: string
}) {
  if (!discordWebhookUrl) return

  const fields = [{ name: 'Email', value: data.email, inline: true }]
  if (data.name) fields.push({ name: 'Name', value: data.name, inline: true })
  if (data.company) fields.push({ name: 'Company', value: data.company, inline: true })
  if (data.source) fields.push({ name: 'Source', value: data.source, inline: true })
  if (data.tier) fields.push({ name: 'Interest', value: data.tier, inline: true })
  if (data.message) fields.push({ name: 'Message', value: data.message.slice(0, 1024), inline: false })

  try {
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'MUTX Leads',
        avatar_url: 'https://mutx.dev/logo.png',
        embeds: [{
          title: 'New PicoMUTX Lead',
          description: `**${data.email}** just signed up.`,
          color: 0x06b6d4,
          fields,
          footer: { text: 'MUTX Lead Pipeline' },
          timestamp: new Date().toISOString(),
        }],
      }),
    })
  } catch (err) {
    console.error('Discord webhook failed:', err)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json().catch(() => ({}))
    const { name, company, message, tier, interest, source, honeypot } = body

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
    const normalizedSource = String(source || 'pico-landing').trim().slice(0, 50)
    const normalizedInterest = tier || interest ? String(tier || interest).trim().slice(0, 50) : undefined
    const trimmedName = name?.trim()
    const trimmedCompany = company?.trim()
    const trimmedMessage = message?.trim()
    const leadMessage = normalizedInterest
      ? [
          `Interest: ${normalizedInterest}`,
          trimmedMessage || null,
        ]
          .filter(Boolean)
          .join('\n\n')
      : trimmedMessage

    const leadCaptureResponse = await captureLeadPost(
      new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          name: trimmedName,
          company: trimmedCompany,
          message: leadMessage,
          source: normalizedSource,
          honeypot: '',
        }),
      }),
    )

    if (!leadCaptureResponse.ok) {
      return leadCaptureResponse
    }

    // Send notification to team
    let notified = false
    if (resend) {
      try {
        await sendNotificationEmail({
          email: normalizedEmail,
          name: trimmedName,
          company: trimmedCompany,
          message: leadMessage,
          tier: normalizedInterest,
          source: normalizedSource,
        })
        notified = true
      } catch (err) {
        console.error('Contact notification email failed:', err)
      }
    } else {
      console.warn('Contact form: Resend not configured, skipping email')
    }

    // Send confirmation to user (uses waitlist template) and add to Resend audience
    await sendConfirmationEmail(normalizedEmail, trimmedName, trimmedCompany)
    await syncResendAudienceContact({
      email: normalizedEmail,
      name: trimmedName,
      company: trimmedCompany,
      source: normalizedSource,
    })
    await notifyDiscord({
      email: normalizedEmail,
      name: trimmedName,
      company: trimmedCompany,
      message: leadMessage,
      tier: normalizedInterest,
      source: normalizedSource,
    })

    return NextResponse.json({
      success: true,
      message: notified
        ? "Got it. We'll be in touch within 24 hours."
        : "Got it. We'll be in touch soon.",
      notified,
    })
  })(request)
}
