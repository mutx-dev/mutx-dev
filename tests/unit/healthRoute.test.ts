import type { NextRequest } from 'next/server'

const getApiBaseUrl = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: jest.fn(() => 'http://localhost:8000'),
}))

function mockRequest() {
  return {} as NextRequest
}

describe('health route proxy', () => {
  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    delete process.env.DASHBOARD_HEALTH_TIMEOUT_MS
  })

  it('returns healthy status when upstream is healthy', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    })

    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/health', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'healthy' })
  })

  it('returns degraded status when upstream is degraded', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'degraded' }),
    })

    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'degraded' })
  })

  it('returns 503 when upstream is unhealthy', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ status: 'unhealthy' }),
    })

    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: 'unhealthy' })
  })

  it('returns 504 when health check times out', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          }, 100)
        })
    )

    const { GET } = await import('../../app/api/dashboard/health/route')

    const responsePromise = GET()

    // Fast-forward past the timeout
    jest.advanceTimersByTime(3000)

    const response = await responsePromise
    jest.useRealTimers()

    expect(response.status).toBe(504)
    await expect(response.json()).resolves.toEqual({
      status: 'degraded',
      error: 'Health check timed out',
    })
  })

  it('returns 500 when fetch throws an error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { GET } = await import('../../app/api/dashboard/health/route')

    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      status: 'unknown',
      error: 'Failed to connect to API',
    })
  })

  it('uses custom timeout from environment variable', async () => {
    process.env.DASHBOARD_HEALTH_TIMEOUT_MS = '5000'
    jest.resetModules()

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    })

    const { GET } = await import('../../app/api/dashboard/health/route')

    await GET()

    // Just verify it doesn't error with custom timeout
    expect(global.fetch).toHaveBeenCalled()
  })
})
