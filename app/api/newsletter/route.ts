import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import postgres, { type Sql } from 'postgres'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const waitlistTemplateId = process.env.RESEND_WAITLIST_TEMPLATE_ID || 'waitlist'
const waitlistFrom = process.env.WAITLIST_FROM || 'MUTX <hi@mutx.dev>'
const waitlistReplyTo = process.env.WAITLIST_REPLY_TO || 'mario@mutx.dev'
const fallbackWaitlistFile = join(process.cwd(), '.mutx', 'waitlist.json')

type WaitlistRecord = {
  email: string
  source: string
  created_at: string
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!value) throw new Error('DATABASE_URL is not configured')
  return value
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mutx.dev'
}

function allowFileFallback() {
  const value = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!value) {
    return true
  }

  try {
    const parsed = new URL(value)
    return ['host', 'localhost', '127.0.0.1', '::1'].includes(parsed.hostname)
  } catch {
    return true
  }
}

function getSslMode(databaseUrl: string): false | 'require' {
  const envSslMode = process.env.DATABASE_SSL_MODE?.toLowerCase()
  if (envSslMode === 'disable') return false
  if (envSslMode === 'require') return 'require'

  const parsed = new URL(databaseUrl)
  const urlSslMode = parsed.searchParams.get('sslmode')?.toLowerCase()

  if (urlSslMode === 'disable') return false
  if (urlSslMode === 'require') return 'require'

  const shouldRequireSsl =
    !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) &&
    !parsed.hostname.endsWith('.railway.internal')

  return shouldRequireSsl ? 'require' : false
}

let sqlClient: Sql | null = null

function getSql() {
  if (sqlClient) return sqlClient
  const databaseUrl = getDatabaseUrl()

  sqlClient = postgres(databaseUrl, {
    ssl: getSslMode(databaseUrl),
    max: 1,
    prepare: false,
    idle_timeout: 10,
    connect_timeout: 10,
  })

  return sqlClient
}

async function ensureTable() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT DEFAULT 'coming-soon',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
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

    try {
      await ensureTable()
      const sql = getSql()

      const existing = await sql`SELECT id FROM waitlist WHERE email = ${normalizedEmail}`
      if (existing.length > 0) {
        return NextResponse.json({ success: true, message: "You're already on the list!", emailSent: false })
      }

      await sql`
        INSERT INTO waitlist (email, source)
        VALUES (${normalizedEmail}, ${normalizedSource || 'coming-soon'})
      `

      console.log('New waitlist signup (DB):', normalizedEmail)
    } catch (databaseError) {
      if (!allowFileFallback()) {
        throw databaseError
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
      console.warn('Waitlist database unavailable; used file fallback for local/dev flow.')
    }

    const emailResult = await sendConfirmationEmail(normalizedEmail)
    if (emailResult.sent) {
      console.log('Confirmation email sent:', emailResult.id)
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
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
      await ensureTable()
      const sql = getSql()
      const result = await sql`SELECT COUNT(*) as count FROM waitlist`
      return NextResponse.json({ count: Number(result[0]?.count || 0) })
    } catch (databaseError) {
      if (!allowFileFallback()) {
        throw databaseError
      }

      const entries = await readFallbackWaitlist()
      return NextResponse.json({ count: entries.length })
    }
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
