import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    // Check honeypot first (before validation - this is a spam protection)
    const rawBody = await req.json().catch(() => ({}))
    if (rawBody?.honeypot) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const validation = await validateRequest(schemas.lead, req)
    if (!validation.success) {
      return validation.response
    }

    const body = {
      email: validation.data.email,
      name: validation.data.name,
      company: validation.data.company,
      message: validation.data.message,
      source: validation.data.source || 'contact-page',
    }

    const response = await fetch(`${API_BASE_URL}/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to submit lead' }))
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    return NextResponse.json(payload, { status: 201 })
  })(request)
}
