import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'


export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/auth/me`,
      { cache: 'no-store' }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch user' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })
    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }
    return nextResponse
  } catch (error) {
    console.error('Auth me proxy error:', error)
    return NextResponse.json({ detail: 'Failed to connect to API' }, { status: 500 })
  }
}
