import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  applyPicoLocalePreference,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'
import { withErrorHandling } from '@/app/api/_lib/errors'
import { schemas, validateRequest } from '@/app/api/_lib/validation'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (req: Request) => {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateRequest(schemas.preferredLocale, req)
    if (!validation.success) {
      return validation.response
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/auth/locale`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
        cache: 'no-store',
      },
    )

    const payload = await response.json().catch(() => ({
      detail: 'Failed to update preferred locale',
    }))
    const nextResponse = NextResponse.json(payload, { status: response.status })

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, {
        ...refreshedTokens,
        preferred_locale:
          typeof payload?.preferred_locale === 'string' ? payload.preferred_locale : null,
      })
    } else if (typeof payload?.preferred_locale === 'string') {
      applyPicoLocalePreference(nextResponse, request, payload.preferred_locale)
    }

    return nextResponse
  })(request)
}
