import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
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

    // Backend enforces ownership from auth token - no user_id needed
    const response = await fetch(`${API_BASE_URL}/v1/agents?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agents' }))
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

    const response = await fetch(`${API_BASE_URL}/v1/agents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to create agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
