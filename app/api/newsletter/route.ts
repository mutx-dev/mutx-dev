import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import sql from '@/lib/db'
import { validateData, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, badRequest } from '@/app/api/_lib/errors'
import { routing, type Locale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type TurnstileVerificationResult = {
  success: boolean
  action?: string
  ['error-codes']?: string[]
}

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'MUTX <waitlist@mutx.dev>'
const resend = resendApiKey ? new Resend(resendApiKey) : null
const waitlistTemplateIdsByLocale = Object.fromEntries(
  routing.locales.map((locale) => [
    locale,
    process.env[`RESEND_WAITLIST_TEMPLATE_ID_${locale.toUpperCase()}`]?.trim(),
  ]),
) as Record<Locale, string | undefined>
const defaultWaitlistTemplateId =
  process.env.RESEND_WAITLIST_TEMPLATE_ID_EN?.trim()
  || process.env.RESEND_WAITLIST_TEMPLATE_ID?.trim()
  || 'waitlist'

function normalizeLocale(locale?: string): Locale {
  const normalizedLocale = locale?.trim().toLowerCase()
  if (!normalizedLocale) return routing.defaultLocale

  const primaryLocale = normalizedLocale.split('-')[0]
  return routing.locales.includes(primaryLocale as Locale)
    ? (primaryLocale as Locale)
    : routing.defaultLocale
}

function getWaitlistTemplateId(locale?: string) {
  const normalizedLocale = normalizeLocale(locale)
  return waitlistTemplateIdsByLocale[normalizedLocale] || defaultWaitlistTemplateId
}

function isEmailDeliveryConfigured() {
  return Boolean(resend && resendFromEmail && defaultWaitlistTemplateId)
}

async function sendWaitlistConfirmationEmail(to: string, locale?: string) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const result = await resend.emails.send({
    from: resendFromEmail,
    to: [to],
    template: {
      id: getWaitlistTemplateId(locale),
      variables: {},
    },
  })

  if (result.error) {
    throw new Error(result.error.message || 'Resend email send failed')
  }

  return result
}

async function ensureTableExists() {
  if (!sql) return
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist_emails (
      email TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
}

function getClientIp(request: Request) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')?.trim()
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim()
  }

  return request.headers.get('x-real-ip')?.trim() ?? undefined
}

async function verifyTurnstileToken(request: Request, token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (!secretKey) {
    throw new Error('TURNSTILE_SECRET_KEY is not configured')
  }

  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  })

  const clientIp = getClientIp(request)
  if (clientIp) {
    payload.set('remoteip', clientIp)
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Turnstile siteverify request failed with status ${response.status}`)
  }

  const result = (await response.json()) as TurnstileVerificationResult

  if (!result.success) {
    console.error('Turnstile verification failed', result['error-codes'] ?? [])
    return false
  }

  if (result.action && result.action !== 'waitlist') {
    console.error('Turnstile verification action mismatch', result.action)
    return false
  }

  return true
}

/**
 * NEXTJS WAITLIST API (SOURCE OF TRUTH)
 * This is the primary endpoint for web-based waitlist submissions.
 * It handles captcha verification, honeypot checks, and direct DB insertion.
 * Backend python API may eventually proxy here or share the same DB.
 */
export async function POST(request: Request): Promise<NextResponse> {
  return withErrorHandling(async (_req: Request) => {
    if (!sql) {
      throw new Error('Database not configured')
    }
    
    const body = await request.json().catch(() => ({}))
    const { email: _email, source, locale, captchaToken, honeypot } = body

    // 1. Honeypot check
    if (honeypot) {
      return badRequest('Invalid input')
    }

    // 2. Validate email with schema
    const validation = await validateData(schemas.newsletter, body)
    if (!validation.success) {
      return validation.response
    }

    // 3. Validate captcha token
    if (typeof captchaToken !== 'string' || !captchaToken.trim()) {
      return badRequest('Please complete the verification challenge.')
    }

    const isValidCaptcha = await verifyTurnstileToken(request, captchaToken)
    if (!isValidCaptcha) {
      return badRequest('Verification failed. Please try again.')
    }

    const normalizedEmail = validation.data.email.toLowerCase().trim()
    const normalizedSource = String(source || 'coming-soon').trim().slice(0, 120) || 'coming-soon'

    await ensureTableExists()

    const result = await sql`
      INSERT INTO waitlist_emails (email, source)
      VALUES (${normalizedEmail}, ${normalizedSource})
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `

    if (result.length === 0) {
      return NextResponse.json({ success: true, message: "You're already on the list!", emailSent: false })
    }

    let emailSent = false
    let message = "You're on the list!"

    if (isEmailDeliveryConfigured()) {
      try {
        await sendWaitlistConfirmationEmail(normalizedEmail, locale)
        emailSent = true
        message = "You're on the list. Check your inbox."
      } catch (emailError) {
        console.error('Waitlist confirmation email failed:', emailError)
      }
    } else {
      console.warn('Waitlist email delivery skipped: Resend waitlist email is not fully configured')
    }

    return NextResponse.json({
      success: true,
      message,
      emailSent,
    })
  })(request)
}

export async function GET(): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!sql) return NextResponse.json({ count: 24 })
    await ensureTableExists()
    const result = await sql`SELECT COUNT(*) as count FROM waitlist_emails`
    // Start at 24 and add current db entries
    const count = Number(result[0].count) + 24
    return NextResponse.json({ count })
  })(new Request('http://localhost'))
}
