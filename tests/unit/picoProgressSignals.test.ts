import {
  describePicoProgressMoment,
  getLatestMeaningfulPicoEvent,
  getNextMissingPicoMilestone,
} from '@/lib/pico/progressionSignals'

describe('pico progression signals', () => {
  it('turns a level-up lesson completion into a visible receipt', () => {
    const moment = describePicoProgressMoment({
      event: 'lesson_completed',
      xpAwarded: 50,
      lessonId: 'run-your-first-agent',
      metadata: {
        auto_progress: {
          completed_tracks: ['track-a'],
          badges: ['first-boot'],
          milestones: ['first_track_finished'],
        },
        level_up: { from: 1, to: 2 },
      },
    })

    expect(moment.title).toBe('2. Run your first agent complete')
    expect(moment.body).toMatch(/level 2/i)
    expect(moment.body).toMatch(/Track A - First Agent/)
    expect(moment.chips).toEqual(
      expect.arrayContaining([
        '+50 XP',
        'Level 2',
        'Milestone: First track finished',
        'Badge: First Boot',
        'Track: Track A - First Agent',
      ]),
    )
  })

  it('finds the next missing milestone from real state', () => {
    expect(
      getNextMissingPicoMilestone({
        completedLessonSlugs: ['install-hermes-locally'],
        completedTrackIds: [],
        milestones: ['first_lesson_finished'],
      }),
    ).toMatchObject({
      id: 'first_track_finished',
      title: 'Finish Track A - First Agent',
      actionLabel: 'Finish the track',
      path: '/academy',
    })

    expect(
      getNextMissingPicoMilestone({
        completedLessonSlugs: ['install-hermes-locally', 'run-your-first-agent'],
        completedTrackIds: ['track-a'],
        milestones: ['first_lesson_finished', 'first_track_finished'],
      }),
    ).toMatchObject({
      id: 'starter_agent_live',
      actionLabel: 'Launch from Control',
      path: '/control#starter-deploy',
    })
  })

  it('ignores empty events and returns the latest meaningful one', () => {
    const event = getLatestMeaningfulPicoEvent([
      {
        event: 'tutor_session_used',
        xpAwarded: 0,
        lessonId: null,
        metadata: {},
      },
      {
        event: 'starter_agent_deployed',
        xpAwarded: 120,
        lessonId: null,
        metadata: {
          auto_progress: {
            completed_tracks: [],
            badges: [],
            milestones: ['starter_agent_live'],
          },
        },
      },
    ])

    expect(event?.event).toBe('starter_agent_deployed')
  })
})
