import { NextRequest } from 'next/server'

import { withErrorHandling } from '@/app/api/_lib/errors'
import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const targetUrl = new URL(`${getApiBaseUrl()}/v1/documents/jobs`)
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value)
    })
    if (!targetUrl.searchParams.has('limit')) {
      targetUrl.searchParams.set('limit', '24')
    }
    return proxyJson(request, targetUrl.toString(), {
      method: 'GET',
      fallbackMessage: 'Failed to fetch document jobs',
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    return proxyJson(request, `${getApiBaseUrl()}/v1/documents/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      fallbackMessage: 'Failed to create document job',
    })
  })(request)
}
