import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'
import { checkAgentOwnership } from '@/app/api/_lib/ownership'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { id } = await params
    
    // Check ownership before proceeding
    const ownershipError = await checkAgentOwnership(request, id)
    if (ownershipError) {
      return ownershipError
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/agents/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request)
    if (!token) {
      return unauthorized()
    }

    const { id } = await params
    
    // Check ownership before proceeding
    const ownershipError = await checkAgentOwnership(request, id)
    if (ownershipError) {
      return ownershipError
    }
    
    const response = await fetch(`${API_BASE_URL}/v1/agents/${id}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }
    
    const payload = await response.json().catch(() => ({ detail: 'Failed to delete agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
