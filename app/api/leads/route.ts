import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { serviceUnavailable, withErrorHandling } from '@/app/api/_lib/errors'
import { validateData, schemas } from '@/app/api/_lib/validation'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const LEADS_FALLBACK_MESSAGE =
  'Lead capture is temporarily unavailable. Please email hello@mutx.dev if you need an immediate response.'

type LeadPayload = {
  email: string
  name?: string
  company?: string
  message?: string
  source: string
}

function shouldFallbackToLocalCapture(response: Response) {
  return response.status === 404 || response.status >= 500
}

async function ensureLeadsTableExists() {
  if (!sql) return false

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      company VARCHAR(255),
      message TEXT,
      source VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `
  await sql`CREATE INDEX IF NOT EXISTS ix_leads_email ON leads (email);`
  await sql`CREATE INDEX IF NOT EXISTS ix_leads_created_at ON leads (created_at);`

  return true
}

async function captureLeadLocally(body: LeadPayload) {
  if (!sql) return null

  await ensureLeadsTableExists()

  const leadId = randomUUID()
  const createdAt = new Date().toISOString()
  const rows = await sql`
    INSERT INTO leads (id, email, name, company, message, source, created_at)
    VALUES (
      ${leadId}::uuid,
      ${body.email},
      ${body.name ?? null},
      ${body.company ?? null},
      ${body.message ?? null},
      ${body.source},
      ${createdAt}::timestamptz
    )
    RETURNING id::text, email, name, company, message, source, created_at::text
  `

  return rows[0] ?? {
    id: leadId,
    email: body.email,
    name: body.name ?? null,
    company: body.company ?? null,
    message: body.message ?? null,
    source: body.source,
    created_at: createdAt,
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const rawBody = await req.json().catch(() => ({}))
    if (rawBody?.honeypot) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const validation = await validateData(schemas.lead, rawBody)
    if (!validation.success) {
      return validation.response
    }

    const body: LeadPayload = {
      email: validation.data.email,
      name: validation.data.name,
      company: validation.data.company,
      message: validation.data.message,
      source: validation.data.source || 'contact-page',
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => ({ detail: 'Failed to submit lead' }))
      if (response.ok) {
        return NextResponse.json(payload, { status: 201 })
      }

      if (!shouldFallbackToLocalCapture(response)) {
        return NextResponse.json(payload, { status: response.status })
      }

      console.warn('Lead capture upstream unavailable, attempting local fallback', {
        status: response.status,
        detail: payload,
      })
    } catch (error) {
      console.warn('Lead capture upstream request failed, attempting local fallback', error)
    }

    try {
      const fallbackLead = await captureLeadLocally(body)
      if (fallbackLead) {
        return NextResponse.json(
          {
            ...fallbackLead,
            fallback: 'local-db',
            message: 'Lead captured locally while the control plane is temporarily unavailable.',
          },
          { status: 201 },
        )
      }
    } catch (error) {
      console.error('Lead capture local fallback failed', error)
    }

    return serviceUnavailable(LEADS_FALLBACK_MESSAGE)
  })(request)
}
