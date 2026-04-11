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

    expect(html).toContain('Progress should come from real outcomes, not fake grind.')
    expect(html).toContain('Sign in to keep this momentum.')
    expect(html).toContain('href="/pico/login"')
    expect(html).toContain('href="/pico/register"')
    expect(html).toContain('Continue 1. Install Hermes locally')
    expect(html).toContain('href="/pico/academy/install-hermes-locally"')
  })

  it('shows the latest unlock, the next lesson, and the next missing milestone for signed-in learners', () => {
    mockUsePicoState.mockReturnValue({
      state: {
        ...basePicoState,
        authenticated: true,
        plan: 'STARTER',
        xpTotal: 120,
        currentLevel: 2,
        levelProgress: {
          currentLevel: 2,
          currentLevelFloorXp: 100,
          nextLevel: 3,
          nextLevelTargetXp: 220,
          xpIntoLevel: 20,
          xpToNextLevel: 100,
          progressPercent: 17,
        },
        completedLessonSlugs: ['install-hermes-locally'],
        milestones: ['first_lesson_finished'],
        recentEvents: [
          {
            event: 'lesson_completed',
            xpAwarded: 50,
            lessonId: 'install-hermes-locally',
            trackId: 'track-a',
            badgeId: null,
            milestoneId: null,
            tutorSessions: 0,
            createdAt: '2026-04-11T02:40:00Z',
            metadata: {
              auto_progress: {
                completed_tracks: [],
                badges: [],
                milestones: ['first_lesson_finished'],
              },
            },
          },
        ],
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
        raw: { current_level: 2, xp_total: 120 },
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    const html = renderToStaticMarkup(<PicoAcademyPage />)

    expect(html).toContain('Progress should feel earned.')
    expect(html).toContain('Latest unlock')
    expect(html).toContain('1. Install Hermes locally complete')
    expect(html).toContain('Missing milestone')
    expect(html).toContain('Finish Track A - First Agent')
    expect(html).toContain('Continue 2. Run your first agent')
    expect(html).toContain('href="/pico/academy/run-your-first-agent"')
    expect(html).toContain('XP only moves on shipped outcomes')
  })
})
