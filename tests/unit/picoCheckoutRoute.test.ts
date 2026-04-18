import { NextRequest } from 'next/server'

const proxyJson = jest.fn()
const hasAuthSession = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  hasAuthSession,
}))

jest.mock('../../app/api/_lib/proxy', () => ({
  proxyJson,
}))

const originalStarterPriceId = process.env.STRIPE_STARTER_PRICE_ID
const originalProPriceId = process.env.STRIPE_PRO_PRICE_ID

type MockCheckoutRequestOptions = {
  body?: Record<string, unknown>
  jsonError?: Error
}

function createCheckoutRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function createJsonRequest(
  url: string,
  { body = {}, jsonError }: MockCheckoutRequestOptions = {},
) {
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
    nextUrl: new URL(url),
    url,
  } as unknown as NextRequest
}

describe('pico checkout route', () => {
  beforeEach(() => {
    jest.resetModules()
    proxyJson.mockReset()
    hasAuthSession.mockReset()
    hasAuthSession.mockReturnValue(true)
    process.env.STRIPE_STARTER_PRICE_ID = 'price_starter'
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
  })

  afterAll(() => {
    process.env.STRIPE_STARTER_PRICE_ID = originalStarterPriceId
    process.env.STRIPE_PRO_PRICE_ID = originalProPriceId
  })

  it('returns 401 for anonymous checkout requests before parsing an invalid body', async () => {
    hasAuthSession.mockReturnValue(false)

    const { POST } = await import('../../app/api/pico/checkout/route')
    const syntaxError = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      status: 400,
    })
    const request = createJsonRequest('https://pico.mutx.dev/api/pico/checkout', {
      jsonError: syntaxError,
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    })
    expect(proxyJson).not.toHaveBeenCalled()
  })

  it('uses /pico return paths on non-pico hosts when resolving a configured price id', async () => {
    const proxiedResponse = new Response(JSON.stringify({ url: 'https://checkout.stripe.com/test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    proxyJson.mockResolvedValue(proxiedResponse)

    const { POST } = await import('../../app/api/pico/checkout/route')
    const request = createCheckoutRequest('http://localhost:3000/api/pico/checkout', {
      priceId: 'price_starter',
    })

    const response = await POST(request)

    expect(response).toBe(proxiedResponse)
    expect(proxyJson).toHaveBeenCalledWith(request, 'http://localhost:8000/v1/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: 'starter',
        success_url: 'http://localhost:3000/pico/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/pico/pricing?checkout=canceled',
        trial_days: 7,
      }),
      fallbackMessage: 'Failed to create checkout session',
    })
  })

  it('keeps canonical pico-host return paths without an extra /pico prefix', async () => {
    const proxiedResponse = new Response(JSON.stringify({ url: 'https://checkout.stripe.com/test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    proxyJson.mockResolvedValue(proxiedResponse)

    const { POST } = await import('../../app/api/pico/checkout/route')
    const request = createCheckoutRequest('https://pico.mutx.dev/api/pico/checkout', {
      planId: 'pro',
    })

    await POST(request)

    expect(proxyJson).toHaveBeenCalledWith(request, 'http://localhost:8000/v1/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: 'pro',
        success_url: 'https://pico.mutx.dev/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://pico.mutx.dev/pricing?checkout=canceled',
        trial_days: 7,
      }),
      fallbackMessage: 'Failed to create checkout session',
    })
  })

  it('rejects unsupported plan identifiers before proxying upstream', async () => {
    const { POST } = await import('../../app/api/pico/checkout/route')
    const request = createCheckoutRequest('http://localhost:3000/api/pico/checkout', {
      planId: 'enterprise',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'A supported planId or priceId is required',
    })
    expect(proxyJson).not.toHaveBeenCalled()
  })
})
