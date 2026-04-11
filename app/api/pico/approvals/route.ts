import { NextRequest } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { proxyJson } from '@/app/api/_lib/proxy'
import { validateRequest } from '@/app/api/_lib/validation'

import { approvalCreateSchema } from '@/app/api/pico/approvals/_validation'

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
    const validation = await validateRequest(approvalCreateSchema, request)
    if (!validation.success) {
      return validation.response
    }

    return proxyJson(request, `${getApiBaseUrl()}/v1/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
      fallbackMessage: 'Failed to create approval request',
    })
  })(request)
}
