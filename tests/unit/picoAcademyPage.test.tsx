import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const mockUsePicoState = jest.fn()
const mockUsePicoBasePath = jest.fn(() => '/pico')

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

jest.mock('@/components/pico/PicoProductShell', () => ({
  PicoProductShell: ({
    title,
    description,
    actions,
    children,
  }: {
    title: string
    description: string
    actions?: React.ReactNode
    children: React.ReactNode
  }) =>
    React.createElement(
      'section',
      { 'data-title': title, 'data-description': description },
      actions,
      children,
    ),
}))

jest.mock('@/components/pico/PicoPathProvider', () => ({
  usePicoBasePath: mockUsePicoBasePath,
}))

jest.mock('@/components/pico/usePicoState', () => ({
  usePicoState: mockUsePicoState,
}))

const basePicoState = {
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
}

import { PicoAcademyPage } from '@/components/pico/PicoAcademyPage'

describe('PicoAcademyPage', () => {
  beforeEach(() => {
    mockUsePicoBasePath.mockReturnValue('/pico')
    mockUsePicoState.mockReset()
  })

  it('renders guest recovery links and points continue CTA at the first lesson', () => {
    mockUsePicoState.mockReturnValue({
      state: {
        ...basePicoState,
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    const html = renderToStaticMarkup(<PicoAcademyPage />)

    expect(html).toContain('Sign in to save lesson progress.')
    expect(html).toContain('href="/pico/login"')
    expect(html).toContain('href="/pico/register"')
    expect(html).toContain('Continue 1. Install Hermes locally')
    expect(html).toContain('href="/pico/academy/install-hermes-locally"')
  })

  it('renders synced learner stats and advances continue CTA to the next incomplete lesson', () => {
    mockUsePicoState.mockReturnValue({
      state: {
        ...basePicoState,
        authenticated: true,
        plan: 'STARTER',
        xpTotal: 120,
        currentLevel: 3,
        levelProgress: {
          currentLevel: 3,
          currentLevelFloorXp: 100,
          nextLevel: 4,
          nextLevelTargetXp: 250,
          xpIntoLevel: 20,
          xpToNextLevel: 130,
          progressPercent: 13,
        },
        completedLessonSlugs: ['install-hermes-locally'],
        tutorAccess: {
          plan: 'STARTER',
          limit: 25,
          remaining: 25,
          used: 0,
          limitReached: false,
          resetPolicy: 'lifetime',
          note: 'Starter tutor allowance',
        },
        completedCount: 1,
        percentComplete: 8,
        raw: { current_level: 3, xp_total: 120 },
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    const html = renderToStaticMarkup(<PicoAcademyPage />)

    expect(html).toContain('Your progression is now explicit.')
    expect(html).toContain('Continue 2. Run your first agent')
    expect(html).toContain('href="/pico/academy/run-your-first-agent"')
    expect(html).toContain('>3<')
    expect(html).toContain('>120<')
  })
})
