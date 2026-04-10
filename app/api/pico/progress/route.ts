import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/pico/progress`, {
      method: 'GET',
      fallbackMessage: 'Failed to fetch Pico progress',
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = await request.json()
    return proxyJson(request, `${getApiBaseUrl()}/v1/pico/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to persist Pico progress',
    })
  })(request)
}
