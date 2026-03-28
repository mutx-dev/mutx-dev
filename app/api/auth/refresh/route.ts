import { NextRequest, NextResponse } from 'next/server'

import { applyAuthCookies, getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const FETCH_TIMEOUT_MS = 5000

export const dynamic = 'force-dynamic'

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.refresh, req)
    if (!validation.success) {
      return validation.response
    }

    const { refresh_token } = validation.data
    
    const response = await fetchWithTimeout(`${getApiBaseUrl()}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Token refresh failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const nextResponse = NextResponse.json({
      access_token: payload.access_token,
      expires_in: payload.expires_in,
    })
    applyAuthCookies(nextResponse, request, payload)

    return nextResponse
  })(request)
}
