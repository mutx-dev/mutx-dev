import {
  applyLessonCompleted,
  createDefaultPicoProgress,
} from '../../lib/pico/academy'
import {
  createLessonCelebration,
  deriveMomentumCue,
  deriveStreakCue,
  registerPicoSession,
} from '../../lib/pico/progressSignals'

describe('pico progress signals', () => {
  it('turns the first agent run into a proof moment', () => {
    let before = createDefaultPicoProgress()
    before = applyLessonCompleted(before, 'install-hermes-locally')

    const after = applyLessonCompleted(before, 'run-your-first-agent')
    const celebration = createLessonCelebration(before, after, 'run-your-first-agent')

    expect(celebration).not.toBeNull()
    expect(celebration?.title).toBe('It works. Your first run landed.')
    expect(celebration?.body).toContain('proof')
    expect(celebration?.chips).toEqual(expect.arrayContaining(['Badge unlocked: First Spark']))
    expect(celebration?.ctaLabel).toBe('Deploy Hermes on a VPS')
    expect(celebration?.ctaHref).toBe('/academy/deploy-hermes-on-a-vps')
  })

  it('calls out deployment when the next move is getting off the laptop', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const momentum = deriveMomentumCue(progress)

    expect(momentum.title).toBe("You're 1 step away from deployment")
    expect(momentum.body).toContain('persistent runtime')
    expect(momentum.ctaHref).toBe('/academy/deploy-hermes-on-a-vps')
  })

  it('frames control as the next unlock once visibility is live', () => {
    let progress = createDefaultPicoProgress()
    for (const lessonSlug of [
      'install-hermes-locally',
      'run-your-first-agent',
      'deploy-hermes-on-a-vps',
      'keep-your-agent-alive',
      'connect-a-messaging-layer',
      'add-your-first-skill',
      'create-a-scheduled-workflow',
      'see-your-agent-activity',
    ]) {
      progress = applyLessonCompleted(progress, lessonSlug)
    }

    const momentum = deriveMomentumCue(progress)

    expect(momentum.title).toBe('Finish this to unlock control')
    expect(momentum.body).toContain('approval')
    expect(momentum.ctaHref).toBe('/academy/set-a-cost-threshold')
  })

  it('continues a local streak on consecutive sessions and restarts cleanly after a break', () => {
    const dayOne = registerPicoSession(undefined, new Date('2026-04-10T09:00:00.000Z'))
    const dayTwo = registerPicoSession(dayOne.session, new Date('2026-04-11T09:00:00.000Z'))
    const afterBreak = registerPicoSession(dayTwo.session, new Date('2026-04-14T09:00:00.000Z'))

    expect(dayTwo.transition).toBe('continued')
    expect(dayTwo.session.streakCount).toBe(2)
    expect(afterBreak.transition).toBe('restart')
    expect(afterBreak.session.streakCount).toBe(1)
  })

  it('reinforces continuation without punishing a broken streak', () => {
    const continued = deriveStreakCue(
      { lastSeenDay: '2026-04-11', streakCount: 3, bestStreakCount: 3, totalSessions: 3 },
      'continued'
    )
    const restarted = deriveStreakCue(
      { lastSeenDay: '2026-04-14', streakCount: 1, bestStreakCount: 3, totalSessions: 4 },
      'restart'
    )

    expect(continued.label).toBe('3-session streak')
    expect(continued.body).toContain('Keep it alive')
    expect(restarted.body).toContain('Fresh streak')
    expect(restarted.body.toLowerCase()).not.toContain('lost')
  })
})
