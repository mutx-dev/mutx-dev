import {
  applyLessonCompleted,
  createDefaultPicoProgress,
  derivePicoProgress,
  getLessonBySlug,
  getPostLessonAction,
  mergePicoProgress,
  selectTrack,
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

  it('prefers the selected track when choosing the next lesson', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')
    progress = applyLessonCompleted(progress, 'run-your-first-agent')
    const selected = selectTrack(progress, 'deployed-agent')
    const derived = derivePicoProgress(selected)

    expect(derived.nextLesson?.slug).toBe('deploy-hermes-on-a-vps')
  })


  it('unlocks the next capability after real milestones land', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const derived = derivePicoProgress(progress)

    expect(derived.unlockedCapabilities.map((capability) => capability.unlockEvent)).toEqual(
      expect.arrayContaining(['first_tutorial_completed', 'first_agent_run']),
    )
    expect(derived.nextCapability?.unlockEvent).toBe('successful_deployment')
  })

  it('pushes completed lessons into the next real action', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const action = getPostLessonAction('run-your-first-agent', progress)

    expect(action.href).toBe('/academy/deploy-hermes-on-a-vps')
    expect(action.actionLabel).toMatch(/Deploy|Start/)
  })

  it('keeps local progress when remote auth state is still empty', () => {
    let local = createDefaultPicoProgress()
    local = applyLessonCompleted(local, 'install-hermes-locally')

    const merged = mergePicoProgress(local, createDefaultPicoProgress())

    expect(merged.completedLessons).toContain('install-hermes-locally')
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
