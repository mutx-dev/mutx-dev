import { isUnauthorizedPayload } from '../../components/pico/PicoAutopilotPageClient'

describe('pico autopilot auth detection', () => {
  it('flags proxy-style unauthorized envelopes', () => {
    expect(
      isUnauthorizedPayload({
        status: 'error',
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      }),
    ).toBe(true)
  })

  it('ignores payloads with the wrong error code shape', () => {
    expect(
      isUnauthorizedPayload({
        status: 'error',
        error: { code: 'FORBIDDEN', message: 'Nope' },
      }),
    ).toBe(false)
    expect(
      isUnauthorizedPayload({
        status: 'ok',
        error: { code: 'UNAUTHORIZED' },
      }),
    ).toBe(false)
    expect(isUnauthorizedPayload(null)).toBe(false)
  })
})
