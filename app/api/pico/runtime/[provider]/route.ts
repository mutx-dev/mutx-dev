import { NextRequest } from 'next/server'

import { getApiBaseUrl, hasAuthSession } from '@/app/api/_lib/controlPlane'
import { unauthorized, withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

type RuntimeProviderRouteProps = {
  params: Promise<{ provider: string }>
}

export async function GET(request: NextRequest, { params }: RuntimeProviderRouteProps) {
  return withErrorHandling(async () => {
    const { provider } = await params
    return proxyJson(request, `${getApiBaseUrl()}/v1/runtime/providers/${provider}`, {
      fallbackMessage: 'Failed to fetch Pico runtime provider state',
    })
  })(request)
}

export async function PUT(request: NextRequest, { params }: RuntimeProviderRouteProps) {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized()
    }

    const { provider } = await params
    const payload = await request.json()
    return proxyJson(request, `${getApiBaseUrl()}/v1/runtime/providers/${provider}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to update Pico runtime provider state',
    })
  })(request)
}
