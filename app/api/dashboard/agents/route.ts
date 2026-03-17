import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

/**
 * Dashboard agents endpoint.
 * Ownership is enforced by the backend - it derives ownership from the auth token.
 * No need to pass user_id or call /auth/me first.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    // Use authenticatedFetch to handle token refresh automatically
    const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
      request,
      `${API_BASE_URL}/v1/agents?limit=20`,
      { cache: 'no-store' }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agents' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })
    
    // If token was refreshed, set the new cookies
    if (tokenRefreshed && cookieHeader) {
      nextResponse.headers.set('Set-Cookie', cookieHeader)
    }
    
    return nextResponse
  })(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const validation = await validateRequest(schemas.agentCreate, req)
    if (!validation.success) {
      return validation.response
    }

    // Use authenticatedFetch to handle token refresh automatically
    const { response, tokenRefreshed, cookieHeader } = await authenticatedFetch(
      request,
      `${API_BASE_URL}/v1/agents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
        cache: 'no-store',
      }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to create agent' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })
    
    // If token was refreshed, set the new cookies
    if (tokenRefreshed && cookieHeader) {
      nextResponse.headers.set('Set-Cookie', cookieHeader)
    }
    
    return nextResponse
  })(request)
}
