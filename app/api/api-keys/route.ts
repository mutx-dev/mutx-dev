import { NextRequest, NextResponse } from 'next/server'

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from '@/app/api/_lib/controlPlane'


export const dynamic = 'force-dynamic'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeApiKeyListPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      skip: 0,
      limit: payload.length,
    }
  }

  if (!isRecord(payload)) {
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: 0,
    }
  }

  return {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items : [],
    total: typeof payload.total === 'number' ? payload.total : Array.isArray(payload.items) ? payload.items.length : 0,
    skip: typeof payload.skip === 'number' ? payload.skip : 0,
    limit: typeof payload.limit === 'number' ? payload.limit : Array.isArray(payload.items) ? payload.items.length : 0,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/api-keys`,
      {
        cache: 'no-store',
      }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to fetch API keys' }))
    const body = response.status >= 200 && response.status < 300 ? normalizeApiKeyListPayload(payload) : payload
    const nextResponse = NextResponse.json(body, { status: response.status })

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }

    return nextResponse
  } catch (error) {
    console.error('API keys fetch error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAuthSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/api-keys`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    )

    const payload = await response.json().catch(() => ({ detail: 'Failed to create API key' }))
    const nextResponse = NextResponse.json(payload, { status: response.status })

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens)
    }

    return nextResponse
  } catch (error) {
    console.error('API key create error:', error)
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
  }
}
