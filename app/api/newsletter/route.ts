import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import postgres, { type Sql } from 'postgres'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!value) throw new Error('DATABASE_URL is not configured')
  return value
}

function shouldUseSsl(databaseUrl: string) {
  const parsed = new URL(databaseUrl)
  const sslMode = parsed.searchParams.get('sslmode')
  if (sslMode === 'disable') return false
  return !['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) && !parsed.hostname.endsWith('.railway.internal')
}

let sqlClient: Sql | null = null

function getSql() {
  if (sqlClient) return sqlClient
  const databaseUrl = getDatabaseUrl()
  
  sqlClient = postgres(databaseUrl, {
    ssl: shouldUseSsl(databaseUrl) ? 'require' : false,
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
    
    await ensureTable()
    const sql = getSql()

    const existing = await sql`SELECT id FROM waitlist WHERE email = ${normalizedEmail}`
    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: "You're already on the list!" })
    }

    await sql`
      INSERT INTO waitlist (email, source)
      VALUES (${normalizedEmail}, ${source || 'coming-soon'})
    `

    console.log('New waitlist signup (DB):', normalizedEmail)

    if (resend) {
      const result = await resend.emails.send({
        from: 'Mario at mutx.dev <hi@mutx.dev>',
        to: normalizedEmail,
        replyTo: 'mario@mutx.dev',
        subject: "You're on the list! 🚀",
        template: {
          id: 'waitlist',
        },
      })

      if (result.error) {
        console.error('Resend error:', result.error)
      } else {
        console.log('Confirmation email sent:', result.data?.id)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "You're on the list!",
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ success: false, error: 'Failed to join waitlist' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureTable()
    const sql = getSql()
    const result = await sql`SELECT COUNT(*) as count FROM waitlist`
    return NextResponse.json({ count: result[0]?.count || 0 })
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
