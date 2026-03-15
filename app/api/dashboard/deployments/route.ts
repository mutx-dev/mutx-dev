import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { validateRequest, schemas } from '@/app/api/_lib/validation'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

/**
 * Get the current user's ID from the auth token.
 * Returns null if the user cannot be determined.
 */
async function getCurrentUserId(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      return null
    }
    
    const user = await response.json()
    return user.id || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    // Get the current user's ID to enforce ownership
    const userId = await getCurrentUserId(token)
    if (!userId) {
      return unauthorized()
    }

    // Filter by user_id to enforce ownership - derived from auth token, not client input
    const response = await fetch(`${API_BASE_URL}/deployments?limit=20&user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch deployments' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const validation = await validateRequest(schemas.deploymentCreate, req)
    if (!validation.success) {
      return validation.response
    }

    const response = await fetch(`${API_BASE_URL}/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to create deployment' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
