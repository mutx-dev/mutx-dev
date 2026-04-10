import {
  applyLessonCompleted,
  createDefaultPicoProgress,
  derivePicoProgress,
  getLessonBySlug,
} from '../../lib/pico/academy'
import { answerPicoTutorQuestion } from '../../lib/pico/tutor'

describe('pico academy progress', () => {
  it('unlocks XP and badges after the first two lessons', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const derived = derivePicoProgress(progress)

    expect(derived.completedLessonCount).toBe(2)
    expect(derived.xp).toBeGreaterThan(100)
    expect(derived.badges).toContain('First Spark')
    expect(derived.unlockedLessonSlugs).toContain('deploy-hermes-on-a-vps')
  })

  it('returns a lesson by slug', () => {
    expect(getLessonBySlug('set-a-cost-threshold')?.title).toBe('Set a cost threshold')
  })
})

describe('pico tutor', () => {
  it('routes scheduling questions to the workflow lesson', () => {
    const answer = answerPicoTutorQuestion('How do I schedule the workflow to run every day?')
    expect(answer.lessonSlug).toBe('create-a-scheduled-workflow')
    expect(answer.nextActions.length).toBeGreaterThan(0)
  })

  it('escalates risky topics instead of bluffing', () => {
    const answer = answerPicoTutorQuestion('Can I delete production credentials after changing billing?')
    expect(answer.escalationReason).not.toBeNull()
  })
})
