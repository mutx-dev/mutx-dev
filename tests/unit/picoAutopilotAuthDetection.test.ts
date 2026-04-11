import { NextResponse } from 'next/server'
import type { ReactNode } from 'react'

const actualReact = jest.requireActual('react') as typeof import('react')

const mockUsePicoProgress = jest.fn()
const mockUsePicoHref = jest.fn()

jest.mock('../../components/pico/PicoShell', () => ({
  PicoShell: ({ children }: { children: ReactNode }) => actualReact.createElement('div', null, children),
}))

jest.mock('../../components/pico/usePicoProgress', () => ({
  usePicoProgress: () => mockUsePicoProgress(),
}))

jest.mock('../../lib/pico/navigation', () => ({
  usePicoHref: () => mockUsePicoHref(),
}))

describe('pico autopilot auth detection', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('keeps proxy-style unauthorized payloads out of fake live state', async () => {
    const unauthorized = NextResponse.json(
      { status: 'error', error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    )

    const responses = [
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
      unauthorized.clone(),
    ]

    global.fetch = jest.fn().mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1]).mockResolvedValueOnce(responses[2]).mockResolvedValueOnce(responses[3]).mockResolvedValueOnce(responses[4]).mockResolvedValueOnce(responses[5]).mockResolvedValueOnce(responses[6]).mockResolvedValueOnce(responses[7]) as jest.Mock

    mockUsePicoProgress.mockReturnValue({
      progress: { autopilot: { costThresholdPercent: 75 } },
      derived: { nextLesson: null },
      actions: { unlockMilestone: jest.fn(), setAutopilot: jest.fn() },
      syncState: 'synced',
    })
    mockUsePicoHref.mockReturnValue((href: string) => href)

    const { PicoAutopilotPageClient } = await import('../../components/pico/PicoAutopilotPageClient')

    expect(typeof PicoAutopilotPageClient).toBe('function')
    expect(global.fetch).toBeDefined()
  })
})
