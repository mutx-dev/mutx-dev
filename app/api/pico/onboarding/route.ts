import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const query = request.nextUrl.search
    return proxyJson(
      request,
      `${getApiBaseUrl()}/v1/onboarding${query}`,
      { fallbackMessage: 'Failed to fetch Pico onboarding state' },
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = await request.json()
    return proxyJson(request, `${getApiBaseUrl()}/v1/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to update Pico onboarding state',
    })
  })(request)
}
