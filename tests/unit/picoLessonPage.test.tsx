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
  normalizePicoState: jest.fn((payload) => payload),
}))

const basePicoState = {
  authenticated: true,
  plan: 'STARTER',
  xpTotal: 50,
  currentLevel: 1,
  levelProgress: {
    currentLevel: 1,
    currentLevelFloorXp: 0,
    nextLevel: 2,
    nextLevelTargetXp: 100,
    xpIntoLevel: 50,
    xpToNextLevel: 50,
    progressPercent: 50,
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
  raw: null,
}

import { PicoLessonPage } from '@/components/pico/PicoLessonPage'
import { getPicoLesson } from '@/lib/pico/academy'

describe('PicoLessonPage', () => {
  beforeEach(() => {
    mockUsePicoBasePath.mockReturnValue('/pico')
    mockUsePicoState.mockReset()
  })

  it('renders a proof requirement before completion can be recorded', () => {
    mockUsePicoState.mockReturnValue({
      state: basePicoState,
      loading: false,
      error: null,
      refresh: jest.fn(),
      markCompleted: jest.fn(),
    })

    const lesson = getPicoLesson('install-hermes-locally')
    if (!lesson) {
      throw new Error('expected shipped lesson')
    }

    const html = renderToStaticMarkup(<PicoLessonPage lesson={lesson} />)

    expect(html).toContain('Proof before progress')
    expect(html).toContain('Paste the exact command output, artifact path, or operator note that proves this lesson is actually done.')
    expect(html).toContain('Record completion')
  })
})
