import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type TurnstileVerificationResult = {
  success: boolean
  action?: string
  ['error-codes']?: string[]
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
export async function POST(request: Request) {
  try {
    if (!sql) {
      throw new Error('Database not configured')
    }
    const body = await request.json()
    const { email, source, captchaToken, honeypot } = body

    // 1. Honeypot check
    if (honeypot) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    if (typeof captchaToken !== 'string' || !captchaToken.trim()) {
      return NextResponse.json({ success: false, error: 'Please complete the verification challenge.' }, { status: 400 })
    }

    const isValidCaptcha = await verifyTurnstileToken(request, captchaToken)
    if (!isValidCaptcha) {
      return NextResponse.json({ success: false, error: 'Verification failed. Please try again.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
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

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
      emailSent: false,
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to join waitlist' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!sql) return NextResponse.json({ count: 24 })
    await ensureTableExists()
    const result = await sql`SELECT COUNT(*) as count FROM waitlist_emails`
    // Start at 24 and add current db entries
    const count = Number(result[0].count) + 24
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Waitlist count error:', error)
    // If DB fails, fallback to just 24
    return NextResponse.json({ count: 24 })
  }
}
