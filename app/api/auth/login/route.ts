import { NextRequest, NextResponse } from 'next/server'

import { applyAuthCookies, getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.login, req)
    if (!validation.success) {
      return validation.response
    }

    const { email, password } = validation.data
    const body = { email, password }

    const response = await fetch(`${getApiBaseUrl()}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Login failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const nextResponse = NextResponse.json(payload)
    applyAuthCookies(nextResponse, request, payload)

    return nextResponse
  })(request)
}
