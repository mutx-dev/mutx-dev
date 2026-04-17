import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { proxyJson } from '@/app/api/_lib/proxy'
import { withErrorHandling } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/governance/attestations`, {
      method: 'GET',
      fallbackMessage: 'Failed to fetch governance attestations',
    })
  })(request)
}
