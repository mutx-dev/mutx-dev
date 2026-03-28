import { NextRequest, NextResponse } from 'next/server'

import { clearAuthCookies, getApiBaseUrl, getRefreshToken } from '@/app/api/_lib/controlPlane'

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  const refreshToken = getRefreshToken(request)
  const accessToken = request.cookies.get('access_token')?.value

  if (refreshToken || accessToken) {
    try {
      await fetch(`${getApiBaseUrl()}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
        cache: 'no-store',
      })
    } catch {
      // Clear local auth state even if the control plane is temporarily unavailable.
    }
  }

  const response = NextResponse.json({ success: true })
  clearAuthCookies(response, request)
  return response
}
