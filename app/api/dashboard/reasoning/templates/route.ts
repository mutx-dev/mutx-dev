import { NextRequest } from 'next/server'

import { withErrorHandling } from '@/app/api/_lib/errors'
import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const targetUrl = new URL(`${getApiBaseUrl()}/v1/reasoning/templates`)
    return proxyJson(request, targetUrl.toString(), {
      method: 'GET',
      fallbackMessage: 'Failed to fetch reasoning templates',
    })
  })(request)
}
