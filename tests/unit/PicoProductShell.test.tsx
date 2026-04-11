import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const mockUsePathname = jest.fn(() => '/pico/start')
const mockUsePicoState = jest.fn()

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => React.createElement('a', { href, ...props }, children),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock('@/components/pico/PicoPathProvider', () => ({
  usePicoPath: (path: string) => (path === '/' ? '/pico' : `/pico${path}`),
}))

jest.mock('@/components/pico/usePicoState', () => ({
  usePicoState: () => mockUsePicoState(),
}))

import { PicoProductShell } from '@/components/pico/PicoProductShell'

const baseHookResult = {
  state: {
    authenticated: false,
    plan: null,
    xpTotal: 0,
    currentLevel: 1,
    levelProgress: {
      currentLevel: 1,
      currentLevelFloorXp: 0,
      nextLevel: 2,
      nextLevelTargetXp: 100,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
      progressPercent: 0,
    },
    costThresholdUsd: null,
    approvalGateEnabled: false,
    completedLessonSlugs: [],
    completedTrackIds: [],
    badges: [],
    milestones: [],
    eventCounts: {},
    recentEvents: [],
    tutorSessionsUsed: 0,
    tutorAccess: {
      plan: null,
      limit: null,
      remaining: null,
      used: 0,
      limitReached: false,
      resetPolicy: 'lifetime',
      note: null,
    },
    completedCount: 0,
    percentComplete: 0,
    raw: null,
  },
  loading: false,
  error: null,
  refresh: jest.fn(),
  markCompleted: jest.fn(),
}

describe('PicoProductShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/pico/start')
    mockUsePicoState.mockReset()
  })

  it('shows guest auth actions when no operator session is present', () => {
    mockUsePicoState.mockReturnValue(baseHookResult)

    const html = renderToStaticMarkup(
      <PicoProductShell title='Start' description='Shortest path'>
        <div>Body</div>
      </PicoProductShell>,
    )

    expect(html).toContain('Sign in')
    expect(html).toContain('Create account')
    expect(html).toContain('href="/pico/login"')
    expect(html).toContain('href="/pico/register"')
  })

  it('shows a neutral session check state while auth is loading', () => {
    mockUsePicoState.mockReturnValue({
      ...baseHookResult,
      loading: true,
    })

    const html = renderToStaticMarkup(
      <PicoProductShell title='Start' description='Shortest path'>
        <div>Body</div>
      </PicoProductShell>,
    )

    expect(html).toContain('Checking session')
    expect(html).not.toContain('Create account')
  })

  it('shows signed-in chrome once Pico state resolves an operator session', () => {
    mockUsePicoState.mockReturnValue({
      ...baseHookResult,
      state: {
        ...baseHookResult.state,
        authenticated: true,
        plan: 'STARTER_PLAN',
      },
    })

    const html = renderToStaticMarkup(
      <PicoProductShell title='Control' description='Operator view'>
        <div>Body</div>
      </PicoProductShell>,
    )

    expect(html).toContain('Signed in · Starter Plan')
    expect(html).toContain('Continue setup')
    expect(html).toContain('Open control')
    expect(html).toContain('href="/pico/start"')
    expect(html).toContain('href="/pico/control"')
    expect(html).not.toContain('Create account')
  })
})
