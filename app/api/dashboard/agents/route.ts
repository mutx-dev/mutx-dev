import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, getRefreshToken, refreshAuthToken, getCookieDomain, shouldUseSecureCookies } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

async function fetchWithTokenRefresh(
  request: NextRequest,
  url: string,
  options: RequestInit = {}
): Promise<{ response: Response; newToken?: string }> {
  let token = await getAuthToken(request)
  
  if (!token) {
    return { response: new Response(JSON.stringify({ detail: 'Unauthorized' }), { status: 401 }) }
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  // If unauthorized, try to refresh the token
  if (response.status === 401) {
    const refreshToken = getRefreshToken(request)
    if (refreshToken) {
      const refreshResult = await refreshAuthToken(request, refreshToken)
      
      if (refreshResult) {
        token = refreshResult.access_token
        
        // Retry with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        })
        
        return { response, newToken: token }
      }
    }
  }

  return { response }
}

function createTokenRefreshResponse(
  request: NextRequest,
  newToken: string,
  originalResponse: Response,
  originalPayload: unknown
): NextResponse {
  const secureCookies = shouldUseSecureCookies(request)
  const cookieDomain = getCookieDomain(request)
  
  const nextResponse = NextResponse.json(originalPayload, { status: originalResponse.status })
  
  // Update access token cookie
  nextResponse.cookies.set('access_token', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    domain: cookieDomain,
    path: '/',
    maxAge: 1800, // 30 minutes
  })
  
  return nextResponse
}

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

    // Backend enforces ownership from auth token - no user_id needed
    const { response, newToken } = await fetchWithTokenRefresh(
      request,
      `${API_BASE_URL}/v1/agents?limit=20`,
      { cache: 'no-store' }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agents' }))
    
    // If token was refreshed, update cookies
    if (newToken && response.ok) {
      return createTokenRefreshResponse(request, newToken, response, payload)
    }
    
    return NextResponse.json(payload, { status: response.status })
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

    const { response, newToken } = await fetchWithTokenRefresh(
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
    
    // If token was refreshed, update cookies
    if (newToken && response.ok) {
      return createTokenRefreshResponse(request, newToken, response, payload)
    }
    
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
