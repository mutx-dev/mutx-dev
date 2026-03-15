import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

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
    
    const response = await fetch(`${API_BASE_URL}/api/deployments/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch deployment' }))
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
    
    const response = await fetch(`${API_BASE_URL}/api/deployments/${id}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }
    
    const payload = await response.json().catch(() => ({ detail: 'Failed to delete deployment' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
