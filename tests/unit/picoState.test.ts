import {
  completeLesson,
  createInitialWorkspaceState,
  queueApproval,
  recordManualRun,
  setApprovalGateEnabled,
  setMonthlyBudget,
  startLesson,
} from '../../lib/pico/state'

describe('Pico workspace state', () => {
  it('bootstraps a starter beta workspace', () => {
    const state = createInitialWorkspaceState()

    expect(state.plan).toBe('starter')
    expect(state.xp).toBe(25)
    expect(state.events[0]?.title).toBe('Workspace created')
  })

  it('awards first tutorial XP on lesson start', () => {
    const initial = createInitialWorkspaceState()
    const started = startLesson(initial, 'install-hermes-locally')

    expect(started.startedLessonIds).toContain('install-hermes-locally')
    expect(started.milestones).toContain('first-tutorial-started')
    expect(started.xp).toBeGreaterThan(initial.xp)
  })

  it('unlocks first-run milestone and connects autopilot on lesson completion', () => {
    const initial = createInitialWorkspaceState()
    const afterFirst = completeLesson(startLesson(initial, 'install-hermes-locally'), 'install-hermes-locally')
    const afterSecond = completeLesson(startLesson(afterFirst, 'run-first-agent'), 'run-first-agent')

    expect(afterSecond.completedLessonIds).toContain('run-first-agent')
    expect(afterSecond.milestones).toContain('first-agent-run')
    expect(afterSecond.autopilot.connected).toBe(true)
  })

  it('opens budget alerts when usage crosses thresholds', () => {
    const initial = setMonthlyBudget(createInitialWorkspaceState(), 10)
    const warning = recordManualRun(initial, { summary: 'Used most of the budget', costDelta: 8 })
    const critical = recordManualRun(warning, { summary: 'Crossed the cap', costDelta: 3 })

    expect(warning.autopilot.alerts.some((alert) => alert.title === 'Budget warning')).toBe(true)
    expect(critical.autopilot.alerts.some((alert) => alert.title === 'Budget cap crossed')).toBe(true)
  })

  it('queues and resolves approvals when the gate is enabled', () => {
    const gated = setApprovalGateEnabled(createInitialWorkspaceState(), true)
    const queued = queueApproval(gated, {
      action: 'Send outbound message',
      reason: 'Touches a real user',
    })

    expect(queued.autopilot.approvals).toHaveLength(1)
    expect(queued.autopilot.approvals[0]?.status).toBe('pending')
  })
})
