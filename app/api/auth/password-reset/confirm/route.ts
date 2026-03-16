import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getCookieDomain, shouldUseSecureCookies } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.passwordResetConfirm, req)
    if (!validation.success) {
      return validation.response
    }

    const { token, new_password } = validation.data

    const response = await fetch(`${API_BASE_URL}/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Password reset failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    return NextResponse.json({ message: 'Password reset successful' })
  })(request)
}
