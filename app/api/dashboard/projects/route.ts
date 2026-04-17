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

  if (Array.isArray(payload.sessions)) {
    return payload.sessions
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized()
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/sessions${request.nextUrl.search}`,
      { cache: 'no-store' }
    )

    const payload = await response.json().catch(() => [])
    const projects = Array.from(
      normalizeCollection(payload).reduce<Map<string, { id: string; name: string; sessionCount: number }>>(
        (accumulator, item) => {
          if (!isRecord(item)) {
            return accumulator
          }

          const project =
            pickString(item, ['project', 'project_name', 'workspace']) ||
            pickString(item, ['channel'])

          if (!project) {
            return accumulator
          }

          const key = project.toLowerCase()
          const existing = accumulator.get(key)
          if (existing) {
            existing.sessionCount += 1
            return accumulator
          }

          accumulator.set(key, {
            id: project,
            name: project,
            sessionCount: 1,
          })
          return accumulator
        },
        new Map()
      ).values()
    )

    const nextResponse = NextResponse.json(projects, { status: response.status })

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }

    return nextResponse
  })(request)
}
