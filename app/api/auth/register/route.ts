import { NextRequest, NextResponse } from 'next/server'

import { applyAuthCookies, getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const validation = await validateRequest(schemas.register, req)
    if (!validation.success) {
      return validation.response
    }

    const { email, password, name } = validation.data
    const body = { email, password, name }
    
    const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Registration failed' }))

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status })
    }

    const nextResponse = NextResponse.json(payload)
    applyAuthCookies(nextResponse, request, payload)

    return nextResponse
  })(request)
}
