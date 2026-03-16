import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.passwordResetRequest, req)
    if (!validation.success) {
      return validation.response
    }

    const { email } = validation.data

    const response = await fetch(`${API_BASE_URL}/v1/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Password reset request failed' }))

    // Always return success to prevent email enumeration
    if (!response.ok) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
  })(request)
}
