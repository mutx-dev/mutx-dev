import type { NextRequest } from 'next/server'

const applyAuthCookies = jest.fn()
const authenticatedFetch = jest.fn()

jest.mock('../../app/api/_lib/controlPlane', () => ({
  getApiBaseUrl: () => 'http://localhost:8000',
  applyAuthCookies,
  authenticatedFetch,
}))

function mockJsonRequest(body: unknown) {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
    cookies: {
      get: () => undefined,
    },
  } as unknown as NextRequest
}

describe('pico tutor route', () => {
  beforeEach(() => {
    jest.resetModules()
    applyAuthCookies.mockReset()
    authenticatedFetch.mockReset()
  })

  it('returns a grounded tutor reply for a valid question', async () => {
    const { POST } = await import('../../app/api/pico/tutor/route')
    authenticatedFetch.mockResolvedValue({
      response: {
        status: 200,
        json: async () => ({
        title: 'Create a scheduled workflow',
        summary: 'Open the scheduling lesson and create one cron workflow.',
        answer: 'Open the scheduling lesson and create one cron workflow.',
        confidence: 'high',
        nextActions: ['Open the scheduling lesson', 'Create one cron workflow'],
        lessons: [
          {
            id: 'create-a-scheduled-workflow',
            title: 'Create a scheduled workflow',
            href: '/pico/academy/create-a-scheduled-workflow',
          },
        ],
        docs: [
          {
            label: 'github.com',
            href: 'https://github.com/nousresearch/hermes-agent',
            sourcePath: 'github.com',
          },
        ],
        recommendedLessonIds: ['create-a-scheduled-workflow'],
        escalate: false,
        structured: {
          situation: 'The workflow is blocked at scheduling.',
          diagnosis: 'Use the scheduling lesson as the primary recovery path.',
          steps: ['Open the lesson', 'Create one cron job'],
          commands: [],
          verify: ['The cron entry exists and is visible after reload.'],
          ifThisFails: ['Paste the failing schedule output.'],
          officialLinks: [],
          sources: [],
        },
        intent: 'integrate',
        skillLevel: 'intermediate',
        usedOfficialFallback: false,
        }),
      },
      tokenRefreshed: false,
    })

    const response = await POST(
      mockJsonRequest({
        question: 'How do I schedule a cron workflow for my agent?',
        lessonSlug: 'create-a-scheduled-workflow',
      }) as never,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      title: 'Create a scheduled workflow',
      recommendedLessonIds: expect.arrayContaining(['create-a-scheduled-workflow']),
      lessons: expect.arrayContaining([
        expect.objectContaining({ href: '/pico/academy/create-a-scheduled-workflow' }),
      ]),
      nextActions: expect.any(Array),
      structured: expect.objectContaining({
        diagnosis: expect.any(String),
      }),
    })
  })

  it('rejects empty questions', async () => {
    const { POST } = await import('../../app/api/pico/tutor/route')

    const response = await POST(
      mockJsonRequest({ question: '   ' }) as never,
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      error: {
        code: 'BAD_REQUEST',
        message: 'Question is required',
      },
    })
  })
})
