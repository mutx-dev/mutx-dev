import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/clawhub/bundles`, {
      fallbackMessage: 'Failed to fetch skill bundles',
    })
  })(request)
}
