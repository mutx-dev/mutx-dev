import { NextResponse } from 'next/server'

import { getApiBaseUrl } from '@/app/api/_lib/controlPlane'

const API_BASE_URL = getApiBaseUrl()
const DEFAULT_HEALTH_TIMEOUT_MS = 2500
const parsedTimeoutMs = Number(process.env.DASHBOARD_HEALTH_TIMEOUT_MS)
const HEALTH_TIMEOUT_MS =
  Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0
    ? Math.max(50, Math.trunc(parsedTimeoutMs))
    : DEFAULT_HEALTH_TIMEOUT_MS

export const dynamic = 'force-dynamic'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('socket hang up') ||
    message.includes('econnreset') ||
    message.includes('connection reset') ||
    message.includes('ECONNREFUSED') ||
    message.includes('connect econnrefused')
  )
}

export async function GET() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, HEALTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const payload = await response.json().catch(() => ({ status: 'unknown' }))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error('Dashboard health proxy error:', error)
    if (isAbortError(error)) {
      return NextResponse.json({ status: 'degraded', error: 'Health check timed out' }, { status: 504 })
    }
    if (isConnectionError(error)) {
      return NextResponse.json({ status: 'degraded', error: 'Connection failed' }, { status: 503 })
    }
    return NextResponse.json({ status: 'unknown', error: 'Failed to connect to API' }, { status: 500 })
  } finally {
    clearTimeout(timeoutId)
  }
}
