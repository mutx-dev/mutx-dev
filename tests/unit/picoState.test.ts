import {
  collectCompletedLessons,
  extractPicoErrorMessage,
  normalizePicoState,
} from '@/components/pico/usePicoState'

describe('usePicoState helpers', () => {
  it('recognizes completed lesson ids from the shipped backend recent_events shape', () => {
    const payload = {
      plan: 'STARTER',
      recent_events: [
        {
          event: 'lesson_completed',
          lesson_id: 'install-hermes-locally',
        },
      ],
    }

    expect(collectCompletedLessons(payload)).toEqual(['install-hermes-locally'])
    expect(normalizePicoState(payload, true)).toMatchObject({
      authenticated: true,
      plan: 'STARTER',
      completedLessonSlugs: ['install-hermes-locally'],
      completedCount: 1,
    })
  })

  it('dedupes nested completion records and ignores unknown lesson slugs', () => {
    expect(
      collectCompletedLessons({
        completed_lessons: ['install-hermes-locally', 'missing-lesson'],
        recent_events: [
          {
            event: 'lesson_completed',
            lesson_id: 'install-hermes-locally',
          },
          {
            items: [
              { lesson_slug: 'run-your-first-agent', completed: true },
              { lessonSlug: 'run-your-first-agent', status: 'completed' },
              { lessonSlug: 'missing-lesson', completed: true },
            ],
          },
        ],
      }),
    ).toEqual(['install-hermes-locally', 'run-your-first-agent'])
  })

  it('extracts the most helpful progress error message', () => {
    expect(extractPicoErrorMessage({ detail: 'Session expired' }, 'fallback')).toBe('Session expired')
    expect(extractPicoErrorMessage({ error: { message: 'Gateway offline' } }, 'fallback')).toBe(
      'Gateway offline',
    )
    expect(extractPicoErrorMessage('', 'fallback')).toBe('fallback')
  })
})
