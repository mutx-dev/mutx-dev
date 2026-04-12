import type { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession: () => true,
}))

function mockJsonRequest(body: unknown) {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
    cookies: {
      get: () => ({ value: 'token' }),
    },
  } as unknown as NextRequest
}

describe('pico tutor openai route', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
  })

  it('loads the current connection status', async () => {
    const { GET } = await import('../../app/api/pico/tutor/openai/route')
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({
          provider: 'openai',
          status: 'disconnected',
          source: 'none',
          connected: false,
          model: 'gpt-5-mini',
          message: 'No OpenAI key is connected.',
        }),
      },
      tokenRefreshed: false,
    })

    const response = await GET(mockJsonRequest({}) as never)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      provider: 'openai',
      status: 'disconnected',
      connected: false,
    })
  })

  it('connects an OpenAI key', async () => {
    const { PUT } = await import('../../app/api/pico/tutor/openai/route')
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({
          provider: 'openai',
          status: 'connected',
          source: 'user',
          connected: true,
          model: 'gpt-5-mini',
          maskedKey: '••••1234',
          message: 'Your OpenAI key is active.',
        }),
      },
      tokenRefreshed: false,
    })

    const response = await PUT(
      mockJsonRequest({ apiKey: 'sk-proj-test-openai-connection-1234' }) as never,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'connected',
      maskedKey: '••••1234',
    })
  })

  it('rejects empty connection payloads', async () => {
    const { PUT } = await import('../../app/api/pico/tutor/openai/route')

    const response = await PUT(mockJsonRequest({ apiKey: '   ' }) as never)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      error: {
        code: 'BAD_REQUEST',
        message: 'OpenAI API key is required',
      },
    })
  })

  it('disconnects the saved key', async () => {
    const { DELETE } = await import('../../app/api/pico/tutor/openai/route')
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({
          provider: 'openai',
          status: 'disconnected',
          source: 'none',
          connected: false,
          model: 'gpt-5-mini',
          message: 'No OpenAI key is connected.',
        }),
      },
      tokenRefreshed: false,
    })

    const response = await DELETE(mockJsonRequest({}) as never)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'disconnected',
      connected: false,
    })
  })
})
