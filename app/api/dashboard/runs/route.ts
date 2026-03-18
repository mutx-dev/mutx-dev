import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl, getAuthToken, authenticatedFetch } from '@/app/api/_lib/controlPlane'
import { withErrorHandling, unauthorized } from '@/app/api/_lib/errors'

const API_BASE_URL = getApiBaseUrl()

export const dynamic = 'force-dynamic'

interface Run {
  id: string
  agent_id: string
  status: string
  created_at: string
  completed_at?: string
  duration_ms?: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    const token = await getAuthToken(request as NextRequest)
    if (!token) {
      return unauthorized()
    }

    const { response } = await authenticatedFetch(
      request as NextRequest,
      `${API_BASE_URL}/v1/runs?limit=100`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json({ runs: [], count: 0 }, { status: 200 })
    }

    const data = await response.json().catch(() => ({}))
    const runs: Run[] = Array.isArray(data) ? data : (data.runs ?? [])
    const count = Array.isArray(data) ? data.length : (data.count ?? runs.length)

    return NextResponse.json({ runs, count }, { status: 200 })
  })(request)
}
