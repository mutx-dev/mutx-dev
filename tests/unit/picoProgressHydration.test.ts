import {
  applyLessonCompleted,
  createDefaultPicoProgress,
  updateLessonWorkspace,
  updatePlatformPreferences,
} from '../../lib/pico/academy'
import { shouldSyncHydratedProgress } from '../../components/pico/usePicoProgress'

describe('pico progress hydration sync', () => {
  it('syncs merged local progress back to the backend when remote progress is stale', () => {
    const remote = createDefaultPicoProgress()
    const merged = applyLessonCompleted(remote, 'install-hermes-locally')

    expect(shouldSyncHydratedProgress(remote, merged)).toBe(true)
  })

  it('does not resync when the merged progress already matches the backend', () => {
    const remote = applyLessonCompleted(createDefaultPicoProgress(), 'install-hermes-locally')

    expect(shouldSyncHydratedProgress(remote, remote)).toBe(false)
  })

  it('resyncs when platform or lesson workspace preferences change locally', () => {
    const remote = createDefaultPicoProgress()
    const withPlatform = updatePlatformPreferences(remote, {
      activeSurface: 'academy',
      lastOpenedLessonSlug: 'install-hermes-locally',
      railCollapsed: true,
      helpLaneOpen: true,
    })
    const withWorkspace = updateLessonWorkspace(withPlatform, 'install-hermes-locally', {
      activeStepIndex: 1,
      completedStepIndexes: [0],
      notes: 'save this',
      evidence: 'proof',
      updatedAt: new Date().toISOString(),
    })

    expect(shouldSyncHydratedProgress(remote, withWorkspace)).toBe(true)
  })
})
