import { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession,
}))

type MockRequestOptions = {
  body?: unknown
  jsonError?: Error
}

function createJsonRequest(options: MockRequestOptions = {}) {
  const { body = {}, jsonError } = options

  return {
    json: async () => {
      if (jsonError) {
        throw jsonError
      }
      return body
    },
    headers: {
      get: () => null,
    },
    cookies: {
      get: () => undefined,
    },
    nextUrl: new URL('https://pico.mutx.dev/api/pico/progress'),
  } as unknown as NextRequest
}

describe('pico progress route', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
    hasAuthSession.mockReset()
    hasAuthSession.mockReturnValue(true)
  })

  it('returns 401 for progress reads when no auth session exists', async () => {
    hasAuthSession.mockReturnValue(false)

    const { GET } = await import('../../app/api/pico/progress/route')
    const request = new NextRequest('https://pico.mutx.dev/api/pico/progress')

    const response = await GET(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })

  it('returns 401 for progress writes before parsing an invalid body', async () => {
    hasAuthSession.mockReturnValue(false)

    const { POST } = await import('../../app/api/pico/progress/route')
    const syntaxError = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      status: 400,
    })

    const response = await POST(
      createJsonRequest({
        jsonError: syntaxError,
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    expect(authenticatedFetch).not.toHaveBeenCalled()
  })

  it('forwards progress writes with a JSON body when authenticated', async () => {
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({
          selectedTrack: 'first-agent',
          completedLessons: ['install-hermes-locally'],
        }),
      },
      tokenRefreshed: false,
    })

    const { POST } = await import('../../app/api/pico/progress/route')
    const request = createJsonRequest({
      body: {
        selectedTrack: 'first-agent',
        completedLessons: ['install-hermes-locally'],
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      selectedTrack: 'first-agent',
      completedLessons: ['install-hermes-locally'],
    })
    expect(authenticatedFetch).toHaveBeenCalledWith(
      request,
      'http://localhost:8000/v1/pico/progress',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTrack: 'first-agent',
          completedLessons: ['install-hermes-locally'],
        }),
        cache: 'no-store',
      },
    )
  })
})
