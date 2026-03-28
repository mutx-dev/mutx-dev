import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'


export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/api-keys/${id}/rotate`,
      {
        method: 'POST',
        cache: 'no-store',
      }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to rotate API key' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }

    return nextResponse
  } catch (error) {
    console.error('API key rotate error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}
