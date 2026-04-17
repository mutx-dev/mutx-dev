import { NextRequest, NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/settings`, {
      fallbackMessage: 'Failed to load settings',
    })
  })(request)
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    return proxyJson(request, `${getApiBaseUrl()}/v1/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: await request.text(),
      fallbackMessage: 'Failed to update settings',
    })
  })(request)
}
