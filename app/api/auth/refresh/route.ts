import { NextRequest, NextResponse } from 'next/server'

import { applyAuthCookies, getApiBaseUrl, getRefreshToken } from '@/app/api/_lib/controlPlane'
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
  return withErrorHandling(async (_req: Request) => {
  return withErrorHandling(async (_req: Request) => {
    const refreshToken = getRefreshToken(request)
    if (!refreshToken) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetchWithTimeout(`${getApiBaseUrl()}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
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
