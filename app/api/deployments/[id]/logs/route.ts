import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'
import { checkDeploymentOwnership } from '@/app/api/_lib/ownership'

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
    const ownershipError = await checkDeploymentOwnership(request, id)
    if (ownershipError) {
      return ownershipError
    }
    
    const { searchParams } = new URL(request.url)
    const paramsStr = searchParams.toString()
    
    const response = await fetch(`${API_BASE_URL}/v1/deployments/${id}/logs?${paramsStr}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch logs' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
