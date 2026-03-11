import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const waitlistTemplateId = process.env.RESEND_WAITLIST_TEMPLATE_ID || 'waitlist'
const waitlistFrom = process.env.WAITLIST_FROM || 'MUTX <hi@mutx.dev>'
const waitlistReplyTo = process.env.WAITLIST_REPLY_TO || 'mario@mutx.dev'
const fallbackWaitlistFile = join(process.cwd(), '.mutx', 'waitlist.json')
const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

type WaitlistRecord = {
  email: string
  source: string
  created_at: string
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mutx.dev'
}

function allowFileFallback() {
  return process.env.NODE_ENV !== 'production'
}

async function persistViaBackend(email: string, source: string) {
  const response = await fetch(`${API_BASE_URL}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  })

  const payload = await response.json().catch(() => ({ message: 'Failed to join waitlist' }))

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || 'Failed to join waitlist')
  }

  return {
    message: payload.message || "You're on the list!",
    duplicate: Boolean(payload.duplicate),
  }
}

async function getCountViaBackend() {
  const response = await fetch(`${API_BASE_URL}/newsletter`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  })

  const payload = await response.json().catch(() => ({ count: 0 }))

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || 'Failed to fetch waitlist count')
  }

  return Number(payload.count || 0)
}

async function readFallbackWaitlist() {
  await mkdir(join(process.cwd(), '.mutx'), { recursive: true })

  try {
    const raw = await readFile(fallbackWaitlistFile, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WaitlistRecord[]) : []
  } catch {
    return []
  }
}

async function writeFallbackWaitlist(entries: WaitlistRecord[]) {
  await mkdir(join(process.cwd(), '.mutx'), { recursive: true })
  await writeFile(fallbackWaitlistFile, JSON.stringify(entries, null, 2))
}

async function sendConfirmationEmail(email: string) {
  if (!resend) {
    return { sent: false, fallback: false }
  }

  const subject = "You're in - welcome to MUTX"
  const siteUrl = getSiteUrl()

  const templateResult = await resend.emails.send({
    from: waitlistFrom,
    to: email,
    replyTo: waitlistReplyTo,
    subject,
    template: {
      id: waitlistTemplateId,
      variables: {
        email,
        site_url: siteUrl,
      },
    },
  })

  if (!templateResult.error) {
    return { sent: true, fallback: false, id: templateResult.data?.id }
  }

  console.error('Resend template error:', templateResult.error)

  const fallbackResult = await resend.emails.send({
    from: waitlistFrom,
    to: email,
    replyTo: waitlistReplyTo,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; background: #050816; color: #ecf5ff; padding: 32px;">
        <div style="max-width: 640px; margin: 0 auto; background: #09101d; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: #67e8f9;">MUTX waitlist</p>
          <h1 style="margin: 0 0 12px; font-size: 32px; line-height: 1.1;">You're on the list.</h1>
          <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #cbd5e1;">
            Thanks for joining MUTX. We'll send early product drops, contributor calls, and launch updates to this inbox.
          </p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #94a3b8;">
            In the meantime, explore the project at <a href="${siteUrl}" style="color: #67e8f9;">${siteUrl}</a>.
          </p>
          <div style="display: inline-block; padding: 12px 16px; border-radius: 999px; background: rgba(103,232,249,0.12); color: #ecfeff; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
            Postgres-backed signup recorded
          </div>
        </div>
      </div>
    `,
    text: `You're on the MUTX waitlist. We'll send early product drops, contributor calls, and launch updates to this inbox. Explore the project at ${siteUrl}.`,
  })

  if (fallbackResult.error) {
    console.error('Resend fallback error:', fallbackResult.error)
    return { sent: false, fallback: true }
  }

  return { sent: true, fallback: true, id: fallbackResult.data?.id }
}

async function sendConfirmationEmailWithTimeout(email: string) {
  try {
    return await Promise.race([
      sendConfirmationEmail(email),
      new Promise<{ sent: false; fallback: true }>((resolve) => {
        setTimeout(() => resolve({ sent: false, fallback: true }), 4000)
      }),
    ])
  } catch (error) {
    console.error('Waitlist email send failed:', error)
    return { sent: false, fallback: true }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, source } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedSource = String(source || 'coming-soon').trim().slice(0, 120)

    let waitlistResult: { message: string; duplicate: boolean }

    try {
      waitlistResult = await persistViaBackend(normalizedEmail, normalizedSource)
    } catch (backendError) {
      if (!allowFileFallback()) {
        throw backendError
      }

      const entries = await readFallbackWaitlist()
      const exists = entries.some((entry) => entry.email === normalizedEmail)

      if (exists) {
        return NextResponse.json({ success: true, message: "You're already on the list!", emailSent: false })
      }

      entries.push({
        email: normalizedEmail,
        source: normalizedSource || 'coming-soon',
        created_at: new Date().toISOString(),
      })

      await writeFallbackWaitlist(entries)
      console.warn('Waitlist backend unavailable; used file fallback for local/dev flow.')
      waitlistResult = { message: "You're on the list!", duplicate: false }
    }

    if (waitlistResult.duplicate) {
      return NextResponse.json({ success: true, message: waitlistResult.message, emailSent: false })
    }

    const emailResult = await sendConfirmationEmailWithTimeout(normalizedEmail)
    if (emailResult.sent) {
      console.log('Confirmation email sent:', emailResult.id)
    }

    return NextResponse.json({
      success: true,
      message: waitlistResult.message,
      emailSent: emailResult.sent,
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to join waitlist' }, { status: 500 })
  }
}

export async function GET() {
  try {
    try {
      const count = await getCountViaBackend()
      return NextResponse.json({ count })
    } catch (backendError) {
      if (!allowFileFallback()) {
        throw backendError
      }

      const entries = await readFallbackWaitlist()
      return NextResponse.json({ count: entries.length })
    }
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
