import { NextRequest } from 'next/server'

import { getRefreshToken, refreshAuthToken, getCookieDomain, shouldUseSecureCookies } from './controlPlane'

export async function tryRefreshToken(request: NextRequest): Promise<boolean> {
  const refreshToken = getRefreshToken(request)
  if (!refreshToken) {
    return false
  }

  const result = await refreshAuthToken(request, refreshToken)
  return result !== null
}

export async function handleAuthError(request: NextRequest): Promise<Response | null> {
  // Try to refresh the token
  const refreshed = await tryRefreshToken(request)
  
  if (refreshed) {
    // Token was refreshed, return a signal to retry the original request
    return new Response(JSON.stringify({ refreshed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Return 401 to trigger client-side redirect to login
  return new Response(JSON.stringify({ detail: 'Session expired' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}
