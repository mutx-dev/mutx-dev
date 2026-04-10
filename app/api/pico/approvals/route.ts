import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const targetUrl = new URL(`${getApiBaseUrl()}/v1/approvals`)
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value)
    })

    return proxyJson(request, targetUrl.toString(), {
      method: 'GET',
      fallbackMessage: 'Failed to fetch approvals',
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = await request.json()
    return proxyJson(request, `${getApiBaseUrl()}/v1/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      fallbackMessage: 'Failed to create approval request',
    })
  })(request)
}
