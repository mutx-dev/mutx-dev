import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { runId } = await context.params
    const { searchParams } = new URL(request.url)
    const upstream = new URL(`${API_BASE_URL}/runs/${runId}/traces`)
    for (const [key, value] of searchParams.entries()) {
      upstream.searchParams.set(key, value)
    }
    if (!upstream.searchParams.has('limit')) {
      upstream.searchParams.set('limit', '100')
    }

    const response = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch traces' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard run traces proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}
