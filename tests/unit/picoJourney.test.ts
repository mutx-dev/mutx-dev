import {
  applyLessonCompleted,
  createDefaultPicoProgress,
  selectTrack,
} from '../../lib/pico/academy'
import {
  getPicoLessonFollowUp,
  getPicoPrimaryJourney,
  getPicoTrackTarget,
} from '../../lib/pico/journey'

describe('pico journey helpers', () => {
  it('defaults the journey to the first track and first lesson', () => {
    const journey = getPicoPrimaryJourney(createDefaultPicoProgress())

    expect(journey.track.slug).toBe('first-agent')
    expect(journey.lesson?.slug).toBe('install-hermes-locally')
    expect(journey.href).toBe('/academy/install-hermes-locally')
  })

  it('moves the primary journey from setup into deployment after the first two lessons', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')
    progress = applyLessonCompleted(progress, 'run-your-first-agent')

    const journey = getPicoPrimaryJourney(progress)

    expect(journey.href).toBe('/academy/deploy-hermes-on-a-vps')
  })

  it('focuses a selected track on its next incomplete lesson', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')
    progress = applyLessonCompleted(progress, 'run-your-first-agent')
    progress = selectTrack(progress, 'deployed-agent')

    const target = getPicoTrackTarget(progress, 'deployed-agent')

    expect(target.selected).toBe(true)
    expect(target.lesson.slug).toBe('deploy-hermes-on-a-vps')
  })

  it('keeps the lesson follow-up on completion instead of jumping ahead early', () => {
    const followUp = getPicoLessonFollowUp(createDefaultPicoProgress(), 'install-hermes-locally')

    expect(followUp?.kind).toBe('complete')
    expect(followUp?.href).toBeNull()
  })

  it('points completed lessons at the next lesson', () => {
    let progress = createDefaultPicoProgress()
    progress = applyLessonCompleted(progress, 'install-hermes-locally')

    const followUp = getPicoLessonFollowUp(progress, 'install-hermes-locally')

    expect(followUp?.kind).toBe('lesson')
    expect(followUp?.href).toBe('/academy/run-your-first-agent')
  })
})
