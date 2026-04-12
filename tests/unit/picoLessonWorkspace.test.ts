import {
  createDefaultLessonWorkspace,
  normalizeLessonWorkspace,
} from '../../components/pico/usePicoLessonWorkspace'

describe('pico lesson workspace', () => {
  it('creates a sane default workspace', () => {
    expect(createDefaultLessonWorkspace(3)).toEqual({
      activeStepIndex: 0,
      completedStepIndexes: [],
      notes: '',
      evidence: '',
      updatedAt: null,
    })
  })

  it('normalizes invalid workspace state against the lesson step count', () => {
    const normalized = normalizeLessonWorkspace(
      {
        activeStepIndex: 99,
        completedStepIndexes: [0, 0, 1, 9, -1],
        notes: 'keep this',
        evidence: 'real proof',
        updatedAt: '2026-04-12T10:00:00.000Z',
      },
      3,
    )

    expect(normalized).toEqual({
      activeStepIndex: 2,
      completedStepIndexes: [0, 1],
      notes: 'keep this',
      evidence: 'real proof',
      updatedAt: '2026-04-12T10:00:00.000Z',
    })
  })
})
