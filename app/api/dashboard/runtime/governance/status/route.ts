import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(
      request,
      `${getApiBaseUrl()}/v1/runtime/governance/status${request.nextUrl.search}`,
      {
        method: 'GET',
        fallbackMessage: 'Failed to fetch governed runtime status',
      },
    )
  })(request)
}
