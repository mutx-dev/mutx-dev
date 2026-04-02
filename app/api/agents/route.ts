import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'


export const dynamic = 'force-dynamic'

/**
 * CLI-compatible agents endpoint.
 * Proxies directly to control plane without user filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (_req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams(searchParams)
    
    const response = await fetch(`${getApiBaseUrl()}/v1/agents?${params}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agents' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const body = await req.json()
    
    const response = await fetch(`${getApiBaseUrl()}/v1/agents`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to create agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
