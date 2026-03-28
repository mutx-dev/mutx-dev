import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'
import { checkDeploymentOwnership } from '@/app/api/_lib/ownership'


export const dynamic = 'force-dynamic'

export async function POST(
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
    
    const body = await req.json()
    
    const response = await fetch(`${getApiBaseUrl()}/v1/deployments/${id}/scale`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to scale deployment' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
