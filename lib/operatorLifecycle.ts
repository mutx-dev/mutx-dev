type RecordValue = Record<string, unknown>

export type LifecycleTone = 'success' | 'warning' | 'error' | 'idle'

export type ApiKeyLifecycleRecord = {
  id: string
  name?: string | null
  created_at?: string | null
  expires_at?: string | null
  is_active?: boolean
  last_used?: string | null
  last_used_at?: string | null
  status?: string | null
  scopes?: string[]
}

export type WebhookLifecycleRecord = {
  id: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
}

export type WebhookDeliveryRecord = {
  id: string
  event: string
  payload: string
  status_code: number | null
  success: boolean
  error_message: string | null
  attempts: number
  created_at: string
  delivered_at: string | null
}

export type WebhookHealthSnapshot = {
  label: string
  tone: LifecycleTone
  latestAttemptAt: string | null
  latestSuccessAt: string | null
  statusCode: number | null
  attempts: number | null
  errorMessage: string | null
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readCollection<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!isRecord(payload)) return []

  for (const key of keys) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value as T[]
    }
  }

  return []
}

function readString(record: RecordValue, key: string) {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

function readBoolean(record: RecordValue, key: string, fallback = false) {
  const value = record[key]
  return typeof value === 'boolean' ? value : fallback
}

function readNumber(record: RecordValue, key: string, fallback: number | null = null) {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function toTimestamp(value?: string | null) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function normalizeApiKeyCollection(payload: unknown): ApiKeyLifecycleRecord[] {
  const records: Array<ApiKeyLifecycleRecord | null> = readCollection<RecordValue>(payload, [
    'items',
    'keys',
    'api_keys',
    'data',
  ]).map((record) => {
    const id = readString(record, 'id')
    if (!id) return null

    return {
      id,
      name: readString(record, 'name'),
      created_at: readString(record, 'created_at'),
      expires_at: readString(record, 'expires_at'),
      is_active: typeof record.is_active === 'boolean' ? record.is_active : undefined,
      last_used: readString(record, 'last_used'),
      last_used_at: readString(record, 'last_used_at'),
      status: readString(record, 'status'),
      scopes: normalizeStringList(record.scopes),
    }
  })

  return records.filter((record): record is ApiKeyLifecycleRecord => record !== null)
}

export function apiKeyLastUsed(key: ApiKeyLifecycleRecord) {
  return key.last_used_at ?? key.last_used ?? null
}

export function isApiKeyRevoked(key: ApiKeyLifecycleRecord) {
  if (typeof key.is_active === 'boolean') {
    return !key.is_active
  }

  const normalizedStatus = (key.status ?? '').toLowerCase()
  return normalizedStatus.includes('revoked') || normalizedStatus.includes('inactive')
}

export function isApiKeyExpired(key: ApiKeyLifecycleRecord, now = Date.now()) {
  const expiresAt = toTimestamp(key.expires_at)
  return expiresAt !== null && expiresAt <= now
}

export function isApiKeyUsable(key: ApiKeyLifecycleRecord, now = Date.now()) {
  return !isApiKeyRevoked(key) && !isApiKeyExpired(key, now)
}

export function apiKeyExpiryMeta(key: ApiKeyLifecycleRecord, now = Date.now()) {
  const expiresAt = toTimestamp(key.expires_at)
  if (expiresAt === null) return null

  if (expiresAt <= now) {
    return { label: 'expired', tone: 'error' as const }
  }

  const daysUntilExpiry = Math.ceil((expiresAt - now) / 86_400_000)
  if (daysUntilExpiry <= 7) {
    return { label: `expires in ${daysUntilExpiry}d`, tone: 'warning' as const }
  }

  return null
}

export function apiKeyLifecycleMeta(key: ApiKeyLifecycleRecord, now = Date.now()) {
  if (isApiKeyRevoked(key)) {
    return { label: 'revoked', tone: 'idle' as const }
  }

  if (isApiKeyExpired(key, now)) {
    return { label: 'expired', tone: 'error' as const }
  }

  return { label: 'active', tone: 'success' as const }
}

export function isApiKeyStale(
  key: ApiKeyLifecycleRecord,
  now = Date.now(),
  staleAfterDays = 30,
) {
  if (!isApiKeyUsable(key, now)) return false

  const freshnessSignal = toTimestamp(apiKeyLastUsed(key) ?? key.created_at ?? null)
  if (freshnessSignal === null) return false

  return freshnessSignal < now - staleAfterDays * 86_400_000
}

export function summarizeApiKeys(keys: ApiKeyLifecycleRecord[], now = Date.now()) {
  return {
    active: keys.filter((key) => isApiKeyUsable(key, now)).length,
    recentlyUsed: keys.filter((key) => {
      const lastUsed = toTimestamp(apiKeyLastUsed(key))
      return lastUsed !== null && lastUsed >= now - 7 * 86_400_000
    }).length,
    expiringSoon: keys.filter((key) => apiKeyExpiryMeta(key, now)?.tone === 'warning').length,
    stale: keys.filter((key) => isApiKeyStale(key, now)).length,
  }
}

export function normalizeWebhookCollection(payload: unknown): WebhookLifecycleRecord[] {
  const records: Array<WebhookLifecycleRecord | null> = readCollection<RecordValue>(payload, [
    'webhooks',
    'items',
    'data',
  ]).map((record) => {
    const id = readString(record, 'id')
    const url = readString(record, 'url')
    if (!id || !url) return null

    return {
      id,
      url,
      events: normalizeStringList(record.events),
      is_active: readBoolean(record, 'is_active'),
      created_at: readString(record, 'created_at') ?? '',
    }
  })

  return records.filter((record): record is WebhookLifecycleRecord => record !== null)
}

export function normalizeWebhookDeliveryCollection(payload: unknown): WebhookDeliveryRecord[] {
  const records: Array<WebhookDeliveryRecord | null> = readCollection<RecordValue>(payload, [
    'deliveries',
    'items',
    'data',
  ]).map((record) => {
    const id = readString(record, 'id')
    if (!id) return null

    const rawPayload = record.payload
    const payloadText =
      typeof rawPayload === 'string'
        ? rawPayload
        : JSON.stringify(rawPayload ?? {}, null, 2)

    return {
      id,
      event: readString(record, 'event') ?? 'unknown',
      payload: payloadText,
      status_code: readNumber(record, 'status_code'),
      success: readBoolean(record, 'success'),
      error_message: readString(record, 'error_message'),
      attempts: readNumber(record, 'attempts', 0) ?? 0,
      created_at: readString(record, 'created_at') ?? new Date(0).toISOString(),
      delivered_at: readString(record, 'delivered_at'),
    }
  })

  return records.filter((record): record is WebhookDeliveryRecord => record !== null)
}

export function latestWebhookDelivery(deliveries: WebhookDeliveryRecord[]) {
  return [...deliveries].sort((left, right) => {
    const leftTime = toTimestamp(left.created_at) ?? 0
    const rightTime = toTimestamp(right.created_at) ?? 0
    return rightTime - leftTime
  })[0] ?? null
}

export function describeWebhookHealth(
  webhook: WebhookLifecycleRecord,
  deliveries: WebhookDeliveryRecord[],
): WebhookHealthSnapshot {
  const latest = latestWebhookDelivery(deliveries)
  const latestAttemptAt = latest?.delivered_at ?? latest?.created_at ?? null
  const latestSuccessAt =
    deliveries
      .filter((delivery) => delivery.success)
      .sort((left, right) => (toTimestamp(right.created_at) ?? 0) - (toTimestamp(left.created_at) ?? 0))[0]
      ?.delivered_at ??
    deliveries
      .filter((delivery) => delivery.success)
      .sort((left, right) => (toTimestamp(right.created_at) ?? 0) - (toTimestamp(left.created_at) ?? 0))[0]
      ?.created_at ??
    null

  if (!webhook.is_active) {
    return {
      label: 'inactive',
      tone: 'idle',
      latestAttemptAt,
      latestSuccessAt,
      statusCode: latest?.status_code ?? null,
      attempts: latest?.attempts ?? null,
      errorMessage: latest?.error_message ?? null,
    }
  }

  if (!latest) {
    return {
      label: 'no deliveries',
      tone: 'idle',
      latestAttemptAt: null,
      latestSuccessAt: null,
      statusCode: null,
      attempts: null,
      errorMessage: null,
    }
  }

  if (latest.success) {
    return {
      label: 'healthy',
      tone: 'success',
      latestAttemptAt,
      latestSuccessAt,
      statusCode: latest.status_code,
      attempts: latest.attempts,
      errorMessage: null,
    }
  }

  return {
    label: 'failing',
    tone: 'error',
    latestAttemptAt,
    latestSuccessAt,
    statusCode: latest.status_code,
    attempts: latest.attempts,
    errorMessage: latest.error_message,
  }
}

export function summarizeWebhookFleet(
  webhooks: WebhookLifecycleRecord[],
  deliveryMap: Record<string, WebhookDeliveryRecord[]>,
) {
  return webhooks.reduce(
    (summary, webhook) => {
      const health = describeWebhookHealth(webhook, deliveryMap[webhook.id] ?? [])
      if (webhook.is_active) {
        summary.active += 1
      }
      if (health.label === 'healthy') {
        summary.healthy += 1
      } else if (health.label === 'failing') {
        summary.attention += 1
      } else if (health.label === 'no deliveries') {
        summary.noDeliveries += 1
      }
      return summary
    },
    {
      active: 0,
      healthy: 0,
      attention: 0,
      noDeliveries: 0,
    },
  )
}
