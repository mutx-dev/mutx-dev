import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const mockUseSearchParams = jest.fn()
const mockUsePicoBasePath = jest.fn(() => '/pico')
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
  useSearchParams: mockUseSearchParams,
}))

jest.mock('@/components/pico/PicoProductShell', () => ({
  PicoProductShell: ({
    title,
    description,
    children,
  }: {
    title: string
    description: string
    children: React.ReactNode
  }) => React.createElement('section', { 'data-title': title, 'data-description': description }, children),
}))

jest.mock('@/components/pico/PicoPathProvider', () => ({
  usePicoBasePath: mockUsePicoBasePath,
}))

jest.mock('@/components/pico/usePicoState', () => ({
  usePicoState: mockUsePicoState,
}))

import { PicoSupportPage, findPicoSupportMatches } from '@/components/pico/PicoSupportPage'

describe('PicoSupportPage', () => {
  beforeEach(() => {
    mockUsePicoBasePath.mockReturnValue('/pico')
    mockUseSearchParams.mockReturnValue({
      get: () => null,
    })
    mockUsePicoState.mockReturnValue({
      state: {
        authenticated: true,
        plan: 'STARTER',
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
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
    })
  })

  it('grounds approval-gate queries in the matching lesson corpus entry', () => {
    const matches = findPicoSupportMatches('approval gate risky action')

    expect(matches).toHaveLength(3)
    expect(matches[0]?.lesson.slug).toBe('add-an-approval-gate')
    expect(matches[0]?.lesson.title).toBe('10. Add an approval gate')
    expect(matches[0]?.score).toBeGreaterThan(0)
  })

  it('renders grounded support results from the search param query', () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'q' ? 'approval gate risky action' : null),
    })

    const html = renderToStaticMarkup(<PicoSupportPage />)

    expect(html).toContain('The tutor will not invent new commands.')
    expect(html).toContain('10. Add an approval gate')
    expect(html).toContain('href="/pico/academy/add-an-approval-gate"')
    expect(html).toContain('Create the approval pause')
    expect(html).not.toContain('Try asking about scope')
  })
})
