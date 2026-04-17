import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'
import { unauthorized, withErrorHandling } from '@/app/api/_lib/errors'

export const dynamic = 'force-dynamic'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return []
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.skills)) {
    return payload.skills
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized()
    }

    const apiBaseUrl = getApiBaseUrl()
    const [overviewResult, skillsResult] = await Promise.all([
      authenticatedFetch(request, `${apiBaseUrl}/v1/assistant/overview${request.nextUrl.search}`, {
        cache: 'no-store',
      }),
      authenticatedFetch(request, `${apiBaseUrl}/v1/clawhub/skills`, {
        cache: 'no-store',
      }),
    ])

    const overviewPayload = await overviewResult.response.json().catch(() => null)
    const skillsPayload = await skillsResult.response.json().catch(() => [])
    const memorySkill = normalizeCollection(skillsPayload).find(
      (item) => isRecord(item) && item.id === 'workspace_memory'
    )

    const nextResponse = NextResponse.json(
      {
        hasAssistant:
          isRecord(overviewPayload) &&
          (overviewPayload.has_assistant === true || isRecord(overviewPayload.assistant)),
        assistant: isRecord(overviewPayload) ? overviewPayload.assistant ?? null : null,
        workspaceMemoryAvailable: Boolean(memorySkill),
      },
      { status: overviewResult.response.ok ? 200 : overviewResult.response.status }
    )

    const refreshedTokens = overviewResult.refreshedTokens || skillsResult.refreshedTokens
    if (refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }

    return nextResponse
  })(request)
}
