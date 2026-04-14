import {
  apiKeyExpiryMeta,
  apiKeyLifecycleMeta,
  describeWebhookHealth,
  normalizeApiKeyCollection,
  normalizeWebhookDeliveryCollection,
  summarizeApiKeys,
  summarizeWebhookFleet,
} from '../../lib/operatorLifecycle'

describe('operatorLifecycle helpers', () => {
  const now = Date.parse('2026-04-14T12:00:00Z')

  it('normalizes API key collections from paginated payloads and summarizes lifecycle state', () => {
    const keys = normalizeApiKeyCollection({
      items: [
        {
          id: 'key_active',
          name: 'active-key',
          is_active: true,
          created_at: '2026-04-01T12:00:00Z',
          last_used: '2026-04-14T08:00:00Z',
          expires_at: '2026-05-20T12:00:00Z',
        },
        {
          id: 'key_expiring',
          name: 'expiring-key',
          is_active: true,
          created_at: '2026-03-01T12:00:00Z',
          last_used: '2026-03-01T12:00:00Z',
          expires_at: '2026-04-16T12:00:00Z',
        },
        {
          id: 'key_revoked',
          name: 'revoked-key',
          is_active: false,
          created_at: '2026-03-10T12:00:00Z',
          expires_at: null,
        },
      ],
    })

    expect(keys).toHaveLength(3)
    expect(apiKeyLifecycleMeta(keys[0], now)).toEqual({ label: 'active', tone: 'success' })
    expect(apiKeyExpiryMeta(keys[1], now)).toEqual({ label: 'expires in 2d', tone: 'warning' })
    expect(apiKeyLifecycleMeta(keys[2], now)).toEqual({ label: 'revoked', tone: 'idle' })
    expect(summarizeApiKeys(keys, now)).toEqual({
      active: 2,
      recentlyUsed: 1,
      expiringSoon: 1,
      stale: 1,
    })
  })

  it('normalizes webhook delivery payloads and derives fleet health from the latest delivery', () => {
    const webhooks = [
      {
        id: 'wh_healthy',
        url: 'https://example.com/healthy',
        events: ['agent.started'],
        is_active: true,
        created_at: '2026-04-10T12:00:00Z',
      },
      {
        id: 'wh_failing',
        url: 'https://example.com/failing',
        events: ['run.failed'],
        is_active: true,
        created_at: '2026-04-10T12:00:00Z',
      },
      {
        id: 'wh_idle',
        url: 'https://example.com/idle',
        events: ['deployment.completed'],
        is_active: true,
        created_at: '2026-04-10T12:00:00Z',
      },
    ]

    const healthyDeliveries = normalizeWebhookDeliveryCollection({
      deliveries: [
        {
          id: 'delivery_healthy',
          event: 'agent.started',
          success: true,
          status_code: 200,
          attempts: 1,
          payload: '{"ok":true}',
          created_at: '2026-04-14T11:55:00Z',
          delivered_at: '2026-04-14T11:55:02Z',
          error_message: null,
        },
      ],
    })
    const failingDeliveries = normalizeWebhookDeliveryCollection({
      items: [
        {
          id: 'delivery_failed',
          event: 'run.failed',
          success: false,
          status_code: 502,
          attempts: 3,
          payload: { ok: false },
          created_at: '2026-04-14T11:50:00Z',
          delivered_at: null,
          error_message: 'Bad gateway',
        },
      ],
    })

    expect(describeWebhookHealth(webhooks[0], healthyDeliveries)).toMatchObject({
      label: 'healthy',
      tone: 'success',
      statusCode: 200,
    })
    expect(describeWebhookHealth(webhooks[1], failingDeliveries)).toMatchObject({
      label: 'failing',
      tone: 'error',
      statusCode: 502,
      attempts: 3,
      errorMessage: 'Bad gateway',
    })
    expect(describeWebhookHealth(webhooks[2], [])).toMatchObject({
      label: 'no deliveries',
      tone: 'idle',
    })

    expect(
      summarizeWebhookFleet(webhooks, {
        wh_healthy: healthyDeliveries,
        wh_failing: failingDeliveries,
      }),
    ).toEqual({
      active: 3,
      healthy: 1,
      attention: 1,
      noDeliveries: 1,
    })
  })
})
