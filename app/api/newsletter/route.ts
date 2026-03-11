import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

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

    // 2. CAPTCHA verification
    if (!process.env.TURNSTILE_SECRET_KEY) {
      throw new Error('CAPTCHA secret key not configured')
    }
    
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
      }),
    })
    
    const turnstileData = await turnstileResponse.json()
    if (!turnstileData.success) {
      return NextResponse.json({ success: false, error: 'Invalid CAPTCHA' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedSource = String(source || 'coming-soon').trim().slice(0, 120)

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
