import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/pico/state`, {
      fallbackMessage: 'Failed to fetch Pico state',
    })
  })(request)
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json().catch(() => ({}))
    return proxyJson(request, `${getApiBaseUrl()}/v1/pico/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      fallbackMessage: 'Failed to update Pico state',
    })
  })(request)
}
