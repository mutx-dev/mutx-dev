import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'
import { unauthorized } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasAuthSession(request)) {
    return unauthorized()
  }

  const payload = await request.json().catch(() => ({}))
  const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
    request,
    `${getApiBaseUrl()}/v1/pico/generate-package`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
  )

  const arrayBuffer = await response.arrayBuffer()
  const nextResponse = new NextResponse(arrayBuffer, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/zip',
      'Content-Disposition':
        response.headers.get('content-disposition') || 'attachment; filename="agent-config.zip"',
    },
  })

  if (tokenRefreshed && refreshedTokens) {
    applyAuthCookies(nextResponse, request, refreshedTokens)
  }

  return nextResponse
}
