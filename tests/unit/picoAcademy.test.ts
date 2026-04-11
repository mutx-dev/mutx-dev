import {
  applyLessonCompleted,
  buildPicoLessonShareMoment,
  createDefaultPicoProgress,
  derivePicoProgress,
  getLatestPicoShareMoment,
  getLessonBySlug,
  getPicoShareSnapshotUrl,
  markProjectShared,
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

  it('keeps local progress when remote auth state is still empty', () => {
    let local = createDefaultPicoProgress()
    local = applyLessonCompleted(local, 'install-hermes-locally')

    const merged = mergePicoProgress(local, createDefaultPicoProgress())

    expect(merged.completedLessons).toContain('install-hermes-locally')
  })

  it('builds a share moment for completed milestone lessons', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const shareMoment = buildPicoLessonShareMoment(progress, 'run-your-first-agent')

    expect(shareMoment?.id).toBe('lesson:run-your-first-agent')
    expect(shareMoment?.milestoneLabel).toBe('First agent run')
    expect(shareMoment?.agentDoes).toContain('Hermes runs and answers real prompts.')
    expect(shareMoment?.achieved).toContain('Hermes answers a real prompt')
  })

  it('surfaces the latest unshared milestone as the share prompt', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    expect(getLatestPicoShareMoment(progress)?.lessonSlug).toBe('run-your-first-agent')

    progress = markProjectShared(progress, 'lesson:run-your-first-agent')
    expect(getLatestPicoShareMoment(progress)).toBeNull()
  })

  it('builds a snapshot url for the share card', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'run-your-first-agent')
    const shareMoment = buildPicoLessonShareMoment(progress, 'run-your-first-agent')

    expect(shareMoment).not.toBeNull()
    const snapshotUrl = getPicoShareSnapshotUrl(shareMoment!, '/academy/run-your-first-agent')

    expect(snapshotUrl).toContain('/api/og-image?')
    expect(snapshotUrl).toContain('title=First+agent+run+unlocked')
    expect(snapshotUrl).toContain('badge=First+agent+run')
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
