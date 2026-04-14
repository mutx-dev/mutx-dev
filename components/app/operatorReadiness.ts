import type { DashboardStatus } from '@/components/dashboard/types'

const DAY_MS = 86_400_000
const API_KEY_EXPIRING_SOON_DAYS = 7
const API_KEY_UNUSED_DAYS = 7
const API_KEY_STALE_DAYS = 30
const WEBHOOK_STALE_DAYS = 7

export type ApiKeyLifecycleInput = {
  created_at?: string | null
  expires_at?: string | null
  is_active?: boolean | null
  last_used?: string | null
  last_used_at?: string | null
  status?: string | null
}

export type WebhookLifecycleInput = {
  created_at?: string | null
  is_active?: boolean | null
}

export type WebhookDeliveryInput = {
  attempts?: number | null
  created_at?: string | null
  delivered_at?: string | null
  error_message?: string | null
  status_code?: number | null
  success?: boolean | null
}

export type ReadinessSignal = {
  detail: string
  label: string
  status: DashboardStatus
}

export type WebhookDeliverySignal = ReadinessSignal & {
  lastDeliveryAt: string | null
  lastStatusCode: number | null
  recentAttempts: number
  recentFailures: number
}

function toTime(value?: string | null) {
  if (!value) return null

  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function daysUntil(targetTime: number, now: number) {
  return Math.ceil((targetTime - now) / DAY_MS)
}

function daysSince(timestamp: number, now: number) {
  return Math.floor((now - timestamp) / DAY_MS)
}

function isApiKeyRevoked(key: ApiKeyLifecycleInput) {
  if (typeof key.is_active === 'boolean') {
    return !key.is_active
  }

  const normalizedStatus = (key.status ?? '').toLowerCase()
  return normalizedStatus.includes('revoked') || normalizedStatus.includes('inactive')
}

export function getApiKeyLastUsed(key: ApiKeyLifecycleInput) {
  return key.last_used_at ?? key.last_used ?? null
}

export function getApiKeyLifecycleState(
  key: ApiKeyLifecycleInput,
  now: number = Date.now(),
): ReadinessSignal {
  if (isApiKeyRevoked(key)) {
    return {
      detail: 'This key has been revoked and is retained only for audit history.',
      label: 'revoked',
      status: 'idle',
    }
  }

  const expiresAt = toTime(key.expires_at)
  if (expiresAt !== null && expiresAt <= now) {
    return {
      detail: 'This key has passed its expiry and will no longer authenticate requests.',
      label: 'expired',
      status: 'error',
    }
  }

  return {
    detail: 'This key can still authenticate requests.',
    label: 'active',
    status: 'success',
  }
}

export function isApiKeyUsable(key: ApiKeyLifecycleInput, now: number = Date.now()) {
  return getApiKeyLifecycleState(key, now).label === 'active'
}

export function getApiKeyReadinessSignal(
  key: ApiKeyLifecycleInput,
  now: number = Date.now(),
): ReadinessSignal | null {
  if (!isApiKeyUsable(key, now)) {
    return null
  }

  const expiresAt = toTime(key.expires_at)
  if (expiresAt !== null) {
    const days = daysUntil(expiresAt, now)
    if (days <= API_KEY_EXPIRING_SOON_DAYS) {
      return {
        detail: `Rotation window is open because the key expires in ${days}d.`,
        label: 'expires soon',
        status: 'warning',
      }
    }
  }

  const lastUsed = toTime(getApiKeyLastUsed(key))
  const createdAt = toTime(key.created_at)

  if (lastUsed === null && createdAt !== null && daysSince(createdAt, now) >= API_KEY_UNUSED_DAYS) {
    return {
      detail: 'No usage has been recorded since the key was created.',
      label: 'unused',
      status: 'warning',
    }
  }

  if (lastUsed !== null && daysSince(lastUsed, now) >= API_KEY_STALE_DAYS) {
    return {
      detail: 'No usage has been recorded in the last 30 days.',
      label: 'stale',
      status: 'warning',
    }
  }

  return {
    detail: 'Recent usage and expiry posture look healthy.',
    label: 'ready',
    status: 'success',
  }
}

function sortDeliveriesByNewest(deliveries: WebhookDeliveryInput[]) {
  return [...deliveries].sort((left, right) => {
    const leftTime = toTime(left.created_at ?? left.delivered_at) ?? 0
    const rightTime = toTime(right.created_at ?? right.delivered_at) ?? 0
    return rightTime - leftTime
  })
}

export function getWebhookLifecycleState(webhook: WebhookLifecycleInput): ReadinessSignal {
  if (!webhook.is_active) {
    return {
      detail: 'This route is paused and will not receive delivery attempts.',
      label: 'inactive',
      status: 'idle',
    }
  }

  return {
    detail: 'This route can receive live test and event deliveries.',
    label: 'active',
    status: 'success',
  }
}

export function getWebhookDeliverySignal(
  webhook: WebhookLifecycleInput,
  deliveries: WebhookDeliveryInput[],
  now: number = Date.now(),
): WebhookDeliverySignal {
  if (!webhook.is_active) {
    return {
      ...getWebhookLifecycleState(webhook),
      lastDeliveryAt: null,
      lastStatusCode: null,
      recentAttempts: 0,
      recentFailures: 0,
    }
  }

  const sortedDeliveries = sortDeliveriesByNewest(deliveries)
  const latestDelivery = sortedDeliveries[0]

  if (!latestDelivery) {
    return {
      detail: 'No deliveries are recorded yet for this route.',
      label: 'not exercised',
      lastDeliveryAt: null,
      lastStatusCode: null,
      recentAttempts: 0,
      recentFailures: 0,
      status: 'idle',
    }
  }

  const lastDeliveryAt = latestDelivery.created_at ?? latestDelivery.delivered_at ?? null
  const lastDeliveryTime = toTime(lastDeliveryAt)
  const recentFailures = sortedDeliveries.filter((delivery) => !delivery.success).length
  const lastStatusCode =
    typeof latestDelivery.status_code === 'number' ? latestDelivery.status_code : null

  if (!latestDelivery.success) {
    return {
      detail: `Latest delivery failed${lastStatusCode ? ` with ${lastStatusCode}` : ''}.`,
      label: 'failing',
      lastDeliveryAt,
      lastStatusCode,
      recentAttempts: sortedDeliveries.length,
      recentFailures,
      status: 'error',
    }
  }

  if (lastDeliveryTime !== null && daysSince(lastDeliveryTime, now) >= WEBHOOK_STALE_DAYS) {
    return {
      detail: 'No delivery has been recorded in the last 7 days.',
      label: 'stale',
      lastDeliveryAt,
      lastStatusCode,
      recentAttempts: sortedDeliveries.length,
      recentFailures,
      status: 'warning',
    }
  }

  if (recentFailures > 0) {
    return {
      detail: `Latest delivery recovered after ${recentFailures} recent failure${recentFailures === 1 ? '' : 's'}.`,
      label: 'recovering',
      lastDeliveryAt,
      lastStatusCode,
      recentAttempts: sortedDeliveries.length,
      recentFailures,
      status: 'warning',
    }
  }

  return {
    detail: 'Recent delivery sample is succeeding.',
    label: 'healthy',
    lastDeliveryAt,
    lastStatusCode,
    recentAttempts: sortedDeliveries.length,
    recentFailures: 0,
    status: 'success',
  }
}
