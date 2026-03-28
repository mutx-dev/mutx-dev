import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'


export const dynamic = 'force-dynamic'

/**
 * Proxy for run traces API.
 * GET: List traces for a run
 * POST: Add traces to a run
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { runId } = await params
    const { searchParams } = new URL(request.url)
    const paramsStr = searchParams.toString()
    
    const response = await fetch(`${getApiBaseUrl()}/v1/runs/${runId}/traces${paramsStr ? '?' + paramsStr : ''}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch traces' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { runId } = await params
    const body = await req.json()
    
    const response = await fetch(`${getApiBaseUrl()}/v1/runs/${runId}/traces`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to add traces' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
