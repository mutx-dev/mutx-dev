import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body?.honeypot) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: body?.email,
        name: body?.name,
        company: body?.company,
        message: body?.message,
        source: body?.source || 'contact-page',
      }),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to submit lead' }))
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    console.error('Lead capture proxy error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}
