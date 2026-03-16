import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

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
    
    const response = await fetch(`${API_BASE_URL}/v1/agents/${id}/graceful-stop`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({ detail: 'Failed to gracefully stop agent' }))
    return NextResponse.json(payload, { status: response.status })
  })(request)
}
