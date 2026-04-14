import {
  getApiKeyLifecycleState,
  getApiKeyReadinessSignal,
  getWebhookDeliverySignal,
} from '../../components/app/operatorReadiness'

const now = new Date('2026-04-14T10:00:00.000Z').getTime()

describe('operator readiness helpers', () => {
  it('marks a live API key as active and ready when usage and expiry are healthy', () => {
    const key = {
      created_at: '2026-04-10T10:00:00.000Z',
      expires_at: '2026-05-10T10:00:00.000Z',
      is_active: true,
      last_used: '2026-04-13T10:00:00.000Z',
    }

    expect(getApiKeyLifecycleState(key, now)).toMatchObject({
      label: 'active',
      status: 'success',
    })
    expect(getApiKeyReadinessSignal(key, now)).toMatchObject({
      label: 'ready',
      status: 'success',
    })
  })

  it('marks a live API key as unused when no use is recorded after seven days', () => {
    const key = {
      created_at: '2026-04-01T10:00:00.000Z',
      expires_at: '2026-05-10T10:00:00.000Z',
      is_active: true,
      last_used: null,
    }

    expect(getApiKeyReadinessSignal(key, now)).toMatchObject({
      label: 'unused',
      status: 'warning',
    })
  })

  it('marks a live API key as expired when its expiry is in the past', () => {
    const key = {
      created_at: '2026-04-01T10:00:00.000Z',
      expires_at: '2026-04-10T10:00:00.000Z',
      is_active: true,
      last_used: '2026-04-09T10:00:00.000Z',
    }

    expect(getApiKeyLifecycleState(key, now)).toMatchObject({
      label: 'expired',
      status: 'error',
    })
    expect(getApiKeyReadinessSignal(key, now)).toBeNull()
  })

  it('marks a webhook as failing when the latest sampled delivery fails', () => {
    const webhook = {
      created_at: '2026-04-01T10:00:00.000Z',
      is_active: true,
    }

    const signal = getWebhookDeliverySignal(
      webhook,
      [
        {
          created_at: '2026-04-14T09:00:00.000Z',
          status_code: 502,
          success: false,
        },
      ],
      now,
    )

    expect(signal).toMatchObject({
      label: 'failing',
      lastStatusCode: 502,
      status: 'error',
    })
  })

  it('marks a webhook as recovering when the latest delivery succeeds after recent failures', () => {
    const webhook = {
      created_at: '2026-04-01T10:00:00.000Z',
      is_active: true,
    }

    const signal = getWebhookDeliverySignal(
      webhook,
      [
        {
          created_at: '2026-04-14T09:00:00.000Z',
          status_code: 204,
          success: true,
        },
        {
          created_at: '2026-04-14T08:00:00.000Z',
          status_code: 502,
          success: false,
        },
      ],
      now,
    )

    expect(signal).toMatchObject({
      label: 'recovering',
      recentFailures: 1,
      status: 'warning',
    })
  })

  it('marks a webhook as stale when no deliveries have landed in seven days', () => {
    const webhook = {
      created_at: '2026-04-01T10:00:00.000Z',
      is_active: true,
    }

    const signal = getWebhookDeliverySignal(
      webhook,
      [
        {
          created_at: '2026-04-01T09:00:00.000Z',
          status_code: 204,
          success: true,
        },
      ],
      now,
    )

    expect(signal).toMatchObject({
      label: 'stale',
      status: 'warning',
    })
  })
})
